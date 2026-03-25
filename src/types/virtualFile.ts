import { readFile, writeFile, exists, lstat, watch, type UnwatchFn } from "@tauri-apps/plugin-fs";
import { isFunction, isTauriMode } from "@/modules/utils";

interface VirtualFile {
	readonly name: string;
	readonly presentation: string;

	read(): Promise<ArrayBuffer>;
	write(data: ArrayBuffer): Promise<void>;

	startWatch(callback: (vfile: VirtualFile) => void): Promise<void>;
	stopWatch(): void;
}

async function createVirtualFile(input: string | Array<string> | File | FileSystemFileHandle | DataTransfer): Promise<VirtualFile> {
	if (isTauriMode) {
		if (typeof input === "string") {
			return new TauriFile(input);
		} else if (Array.isArray(input) && input.length === 1) {
			const fileInfo = await lstat(input[0]);
			if (fileInfo.isFile) {
				return new TauriFile(input[0]);
			};
		};
	} else {
		if (input instanceof File) {
			return new WebFile(input);
		} else if (input instanceof FileSystemFileHandle) {
			return new AccessApiFile(input);
		} else if (input instanceof DataTransfer && input.types.includes("Files") && input.items.length === 1) {
			const item = input.items[0];
			if (isFunction(item.getAsFileSystemHandle)) {
				const handle = await item.getAsFileSystemHandle();
				if (handle?.kind === "file") {
					return new AccessApiFile(handle as FileSystemFileHandle);
				};
			} else {
				const file = input.files[0];
				const entry = item.webkitGetAsEntry();
				if (entry?.isFile) {
					return new WebFile(file);
				};
			};
		};
	};

	throw new Error("Неподдерживаемый тип входного файла");
}

class WebFile implements VirtualFile {

	constructor(private file: File) { }

	get name() { return this.file.name }
	get presentation() { return this.file.name }

	async read() {
		return await this.file.arrayBuffer();
	}

	async write(data: ArrayBuffer) {
		const blob = new Blob([data], { type: this.file.type });
		triggerDownload(this.file.name, blob);
	}

	async startWatch(_callback: (vfile: VirtualFile) => void): Promise<void> { }
	stopWatch(): void { }
}

class AccessApiFile implements VirtualFile {
	private observer: FileSystemObserver | undefined;

	constructor(private handle: FileSystemFileHandle) { }

	get name() { return this.handle.name }
	get presentation() { return this.handle.name }

	async read() {
		const file = await this.handle.getFile();
		return await file.arrayBuffer();
	}

	async write(data: ArrayBuffer) {
		const writableStream = await this.handle.createWritable();
		await writableStream.write(data);
		await writableStream.close();
	}

	async startWatch(callback: (vfile: VirtualFile) => void): Promise<void> {
		if (!isFunction(window.FileSystemObserver)) {
			return;
		};

		this.stopWatch();
		this.observer = new FileSystemObserver((records) => {
			for (const record of records) {
				if (record.type === "modified" || record.type === "appeared") {
					callback(this);
					return;
				};
			};
		});

		try {
			await this.observer.observe(this.handle);
		} catch (error) {
			this.observer = undefined;
			console.error("Failed to start file observation:", error);
		};
	}

	stopWatch(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = undefined;
		};
	}
}

class TauriFile implements VirtualFile {
	private unwatch: UnwatchFn | undefined;
	readonly name;

	constructor(private path: string) {
		this.name = path.split(/[/\\]/).pop() || "";
	}

	get presentation() { return this.path }

	async read() {
		const data = await readFile(this.path);
		return data.buffer;
	}

	async write(data: ArrayBuffer) {
		await writeFile(this.path, new Uint8Array(data));
	}

	async startWatch(callback: (vfile: VirtualFile) => void): Promise<void> {
		this.stopWatch();
		this.unwatch = await watch(this.path, async (event) => {
			if (typeof event.type === "string" || !("modify" in event.type || "create" in event.type)) {
				return;
			};
			if (await exists(this.path)) {
				callback(this);
			};
		}, { delayMs: 1000 });
	}

	stopWatch(): void {
		if (this.unwatch) {
			this.unwatch();
			this.unwatch = undefined;
		};
	}
}

function triggerDownload(filepath: string, data: Blob): void {
	const a = document.createElement("a");
	a.download = filepath;
	a.href = URL.createObjectURL(data);

	a.addEventListener("click", () => {
		a.remove();
		setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
	});
	a.click();
}

export type { VirtualFile };
export { createVirtualFile };