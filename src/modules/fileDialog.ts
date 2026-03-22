import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import type { OpenDialogOptions, SaveDialogOptions } from "@tauri-apps/plugin-dialog";

import { isFunction, isTauriMode } from "@/modules/utils";
import { createVirtualFile } from "@/types/virtualFile";
import type { VirtualFile } from "@/types/virtualFile";

const isModernAPI = isFunction(window.showOpenFilePicker) && isFunction(window.showSaveFilePicker);

function isAbortError(error: unknown): error is DOMException {
	return error instanceof DOMException && error.name === "AbortError";
}

function showOpenFilePickerFallback(extensions: Array<string>, multiple = false): Promise<File[]> {
	return new Promise((resolve) => {
		const input = document.createElement("input");
		input.type = "file";
		input.multiple = multiple;
		input.accept = extensions.map((val) => `.${val}`).join();
		input.style.display = "none";
		document.body.append(input);

		input.addEventListener("cancel", () => {
			input.remove();
		});

		input.addEventListener("change", () => {
			input.remove();
			resolve(Array.from(input.files!));
		});

		if (isFunction(input.showPicker)) {
			input.showPicker();
		} else {
			input.click();
		}
	});
}

async function openFileDialog(description: string, extensions: Array<string>): Promise<VirtualFile | undefined> {
	if (isTauriMode) {
		const options: OpenDialogOptions = {
			multiple: false,
			directory: false,
			filters: [{
				name: description,
				extensions: extensions
			}]
		};

		const path = await openDialog(options);
		if (path) {
			return await createVirtualFile(path);
		};
	} else {
		if (isModernAPI) {
			const options: OpenFilePickerOptions = {
				multiple: false,
				excludeAcceptAllOption: true,
				types: [{
					description,
					accept: {
						"*/*": extensions.map((val) => `.${val}`) as `.${string}`[]
					}
				}]
			};

			try {
				const [handle] = await window.showOpenFilePicker(options);
				return await createVirtualFile(handle);
			} catch (error) {
				if (!isAbortError(error)) {
					throw error;
				};
			};
		} else {
			const [file] = await showOpenFilePickerFallback(extensions);
			return await createVirtualFile(file);
		};
	};
}

async function saveFileDialog(description: string, extensions: Array<string>, defaultName: string): Promise<VirtualFile | undefined> {
	if (isTauriMode) {
		const options: SaveDialogOptions = {
			defaultPath: defaultName,
			filters: [{
				name: description,
				extensions: extensions
			}]
		};

		const path = await saveDialog(options);
		if (path) {
			return await createVirtualFile(path);
		};
	} else {
		if (isModernAPI) {
			const options: SaveFilePickerOptions = {
				suggestedName: defaultName,
				excludeAcceptAllOption: true,
				types: [{
					description: description,
					accept: {
						"*/*": extensions.map((val) => `.${val}`) as `.${string}`[]
					}
				}]
			};

			try {
				const handle = await showSaveFilePicker(options);
				return await createVirtualFile(handle);
			} catch (error) {
				if (!isAbortError(error)) {
					throw error;
				};
			};
		} else {
			const file = new File([""], defaultName);
			return await createVirtualFile(file);
		};
	};
}

export { openFileDialog, saveFileDialog, isModernAPI };