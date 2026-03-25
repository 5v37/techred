import { ref, watchEffect } from "vue";

import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { openFileError, saveFileError, saveFileInfo } from "@/modules/notifications";
import { openFileDialog, saveFileDialog, isModernAPI } from "@/modules/fileDialog";
import { createVirtualFile, VirtualFile } from "@/types/virtualFile";
import modificationTracker from "@/modules/modificationTracker";
import fb2Mapper from "@/modules/fb2Mapper";
import ui from "@/modules/ui";
import { decodeXML, isTauriMode, resolveFileExtension } from "@/modules/utils";
import { pack, unpack } from "@/modules/zip";

const saveFileAvailable = isTauriMode || isModernAPI;
const currentFile = ref<VirtualFile>();

watchEffect(() => {
	const title = `${modificationTracker.docModified.value ? "*" : ""}${!currentFile.value ? "Новый" : currentFile.value.presentation} - Техред`;
	if (isTauriMode) {
		getCurrentWindow().setTitle(title);
	} else {
		document.title = title;
	};
});

if (isTauriMode) {
	const currentWindow = getCurrentWindow();
	currentWindow.onCloseRequested(async (event) => {
		const confirmed = await confirmDiscardChanges();
		if (!confirmed) {
			event.preventDefault();
		};
	});

	currentWindow.onDragDropEvent(async (event) => {
		if (event.payload.type === "drop" && event.payload.paths.length === 1) {
			const vfile = createVirtualFile(event.payload.paths);

			const confirmed = await confirmDiscardChanges();
			if (!confirmed) return;

			await open(vfile);
		};
	});
} else {
	addEventListener("beforeunload", (event: BeforeUnloadEvent) => {
		if (modificationTracker.docModified.value) {
			event.preventDefault();
			return "";
		}
		return false;
	});

	addEventListener("dragover", (e: DragEvent) => {
		const dt = e.dataTransfer;
		if (dt && dt.types.includes("Files") && dt.items.length === 1) {
			e.preventDefault();
			e.stopPropagation();
		};
	}, { capture: true });
	addEventListener("drop", async (e: DragEvent) => {
		const dt = e.dataTransfer;
		if (dt && dt.types.includes("Files") && dt.items.length === 1) {
			e.preventDefault();

			const vfile = createVirtualFile(dt);

			const confirmed = await confirmDiscardChanges();
			if (!confirmed) return;

			await open(vfile);
		};
	});
};

const fileChangeHandle = (vfile: VirtualFile) => {
	ui.openFileChangedDialog().then(async (choice) => {
		if (choice === "reload") {
			await open(Promise.resolve(vfile));
		}
	});
};

async function encode(content: string, fileName: string) {
	let xmlData = new TextEncoder().encode(content).buffer;
	const { name, ext } = resolveFileExtension(fileName);
	if (ext === "fbz" || ext === "zip") {
		const { name: iName, ext: iExt } = resolveFileExtension(name, "application/fb2");
		xmlData = await pack(xmlData, `${iName}.${iExt}`);
	}
	return xmlData;
}

async function open(futureVfile: Promise<VirtualFile | undefined>) {
	try {
		const vfile = await futureVfile;
		if (vfile) {
			currentFile.value?.stopWatch();
			const fileData = await vfile.read();
			const content = decodeXML(await unpack(fileData));

			await fb2Mapper.parse(content);
			currentFile.value = vfile;
			modificationTracker.reset(true);
			await vfile.startWatch(fileChangeHandle);

			return true;
		};
	} catch (error) {
		openFileError(error);
		await reset();
	};

	return false;
}

async function save(futureVfile: Promise<VirtualFile | undefined>) {
	try {
		const vfile = await futureVfile;
		if (vfile) {
			currentFile.value?.stopWatch();
			const content = fb2Mapper.serialize();
			await vfile.write(await encode(content, vfile.name));

			currentFile.value = vfile;
			modificationTracker.reset(false);
			await vfile.startWatch(fileChangeHandle);
			saveFileInfo();

			return true;
		};
	} catch (error) {
		saveFileError(error);
	}

	return false;
}

async function reset() {
	currentFile.value?.stopWatch();
	await fb2Mapper.reset();
	currentFile.value = undefined;
	modificationTracker.reset(true);
}

async function confirmDiscardChanges(): Promise<boolean> {
	if (!modificationTracker.docModified.value) return true;

	const choice = await ui.openSaveChangesDialog();
	if (choice === "save") {
		return currentFile.value && saveFileAvailable ? await saveFile() : await saveFileAs();
	} else if (choice === "discard") {
		return true;
	} else {
		return false;
	};
}

async function initFile(): Promise<boolean> {
	if (isTauriMode) {
		const path = await invoke<string>("file_path");
		if (path) {
			return await open(createVirtualFile(path));
		};
	};
	return false;
}

async function newFile(): Promise<void> {
	const confirmed = await confirmDiscardChanges();
	if (!confirmed) return;

	await reset();
}

async function openFile(): Promise<boolean> {
	const confirmed = await confirmDiscardChanges();
	if (!confirmed) return false;

	return await open(openFileDialog("FictionBook", ["fb2", "fbz", "fb2.zip"]));
}

async function saveFile(): Promise<boolean> {
	if (currentFile.value && saveFileAvailable) {
		return await save(Promise.resolve(currentFile.value));
	};

	return false;
}

async function saveFileAs(): Promise<boolean> {
	let presentation = currentFile.value?.presentation || "Новый.fb2";

	if (!saveFileAvailable) {
		const { name, ext } = resolveFileExtension(presentation);
		if (ext !== "fb2") {
			const { name: iName, ext: iExt } = resolveFileExtension(name, "application/fb2");
			presentation = `${iName}.${iExt}`;
		};
	};
	return await save(saveFileDialog("FictionBook", ["fb2", "fbz", "fb2.zip"], presentation));
}

export { initFile, newFile, openFile, saveFile, saveFileAs, saveFileAvailable, currentFile };