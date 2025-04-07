import { invoke } from "@tauri-apps/api/core";
import { open, OpenDialogOptions, save, SaveDialogOptions } from "@tauri-apps/plugin-dialog";
import { fileOpen, fileSave, FirstFileOpenOptions, FirstFileSaveOptions } from "browser-fs-access";

import { base64toData, decodeXML, isTauriMode, parseDataURL } from "./utils";

async function readTextFile(filePath: string) {
    const fileData = await invoke('open_file', { filePath }) as ArrayBuffer;
    return decodeXML(fileData);
};

export function openInitialFictionBook() {
    return new Promise<{ content: string, path: string } | void>(async (resolve) => {
        if (isTauriMode) {
            const path = await invoke('file_path') as string;
            if (path) {
                const content = await readTextFile(path);
                resolve({ content, path });
            };
        };
        resolve();
    });
};

export function openFictionBookDialog() {
    return new Promise<{ content: string, path: string, handle?: FileSystemFileHandle }>(async (resolve, reject) => {
        if (isTauriMode) {
            const options: OpenDialogOptions = {
                multiple: false,
                directory: false,
                filters: [{
                    name: 'FictionBook',
                    extensions: ['fb2', 'fbz', 'fb2.zip']
                }]
            };

            const path = await open(options);
            if (path) {
                const content = await readTextFile(path);
                resolve({ content, path, handle: undefined });
            };
        } else {
            const options: FirstFileOpenOptions<false> = {
                description: 'FictionBook',
                extensions: ['.fb2'],
                excludeAcceptAllOption: true
            };

            fileOpen(options).then(async file => {
                const fileData = await file.arrayBuffer();                
                const content = decodeXML(fileData);
                resolve({ content, path: file.name, handle: file.handle });
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    reject(error);
                };
            });
        }
    });
};

export function openImageDialog() {
    return new Promise<{ content: string, path: string, handle?: FileSystemFileHandle }>(async (resolve, reject) => {
        if (isTauriMode) {
            const options: OpenDialogOptions = {
                multiple: false,
                directory: false,
                filters: [{
                    name: 'Изображения',
                    extensions: ['png', 'jpg', 'jpeg']
                }]
            };

            const path = await open(options);
            if (path) {
                const fileData = await invoke('open_file', { filePath: path }) as ArrayBuffer;
                const reader = new FileReader();
                reader.readAsDataURL(new Blob([fileData], { type: path.endsWith(".png") ? 'image/png' : 'image/jpeg' }));
                reader.onerror = () => { reject(reader.error) };
                reader.onload = () => {
                    const content = reader.result as string;
                    resolve({ content, path, handle: undefined });
                };
            };
        } else {
            const options: FirstFileOpenOptions<false> = {
                description: "Изображения",
                mimeTypes: ['image/png', 'image/jpeg'],
                excludeAcceptAllOption: true
            };

            fileOpen(options).then(async file => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onerror = () => { reject(reader.error) };
                reader.onload = () => {
                    const content = reader.result as string;
                    resolve({ content, path: file.name, handle: file.handle });
                };
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    reject(error);
                };
            });
        }
    });
};

export function saveFictionBookDialog(fileData: string, filePath: string, saveDirectly?: { fileHandle?: FileSystemFileHandle }) {
    return new Promise<{ path: string, handle?: FileSystemFileHandle }>(async (resolve, reject) => {
        if (isTauriMode) {
            const options: SaveDialogOptions = {
                defaultPath: filePath,
                filters: [{
                    name: 'FictionBook',
                    extensions: ['fb2', 'fbz', 'fb2.zip']
                }]
            };

            const path = saveDirectly ? filePath : await save(options);
            if (path) {
                await invoke("save_file", { filePath: path, content: fileData });
                resolve({ path, handle: undefined });
            };
        } else {
            const blob = Promise.resolve(new Blob([fileData], { type: 'application/fb2' }));
            const options: FirstFileSaveOptions = {
                fileName: filePath,
                description: 'FictionBook',
                extensions: ['.fb2'],
                excludeAcceptAllOption: true
            };

            fileSave(blob, options, saveDirectly?.fileHandle).then((handle) => {
                if (handle) {
                    resolve({ path: handle.name, handle });
                };
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    reject(error);
                };
            });
        }
    });
};

export function saveImageDialog(fileData: string, filePath: string) {
    return new Promise<{ path: string, handle?: FileSystemFileHandle }>(async (resolve, reject) => {
        const image = parseDataURL(fileData);
        if (image && image.base64) {
            if (isTauriMode) {
                const options: SaveDialogOptions = {
                    defaultPath: filePath,
                    filters: [{
                        name: 'Изображения',
                        extensions: image.mime === "image/png" ? ['png'] : ['jpg', 'jpeg']
                    }]
                };

                const path = await save(options);
                if (path) {
                    await invoke("save_file", { filePath: path, content: image.data });
                    resolve({ path, handle: undefined });
                };
            } else {
                const blob = Promise.resolve(new Blob([base64toData(image.data)], { type: image.mime }));
                const options: FirstFileSaveOptions = {
                    fileName: filePath,
                    description: "Изображения",
                    mimeTypes: [image.mime],
                    excludeAcceptAllOption: true
                };

                fileSave(blob, options).then((handle) => {
                    if (handle) {
                        resolve({ path: handle.name, handle });
                    };
                }).catch((error) => {
                    if (error.name !== 'AbortError') {
                        reject(error);
                    };
                });
            };
        };
    });
};