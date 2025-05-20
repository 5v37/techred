import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, OpenDialogOptions, save as saveDialog, SaveDialogOptions } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { fileOpen, fileSave, FirstFileOpenOptions, FirstFileSaveOptions } from "browser-fs-access";

import { base64toData, decodeXML, imageFileType, isTauriMode, isZIP, parseDataURL } from "./utils";
import { encode as encodeZIP, parse as parseZIP } from "uzip";

function unzip(fileData: ArrayBuffer) {
    if (isZIP(fileData)) {
        const unpackedData = Object.values(parseZIP(fileData));
        if (unpackedData.length === 1) {
            return unpackedData[0];
        } else if (unpackedData.length === 0) {
            throw new Error("Файл архива пустой");
        } else {
            throw new Error("Файл архива содержит больше одного файла");
        };
    };
    return fileData;
};

function encode(content: string, filePath: string) {
    let fileData = new TextEncoder().encode(content);
    if (!filePath.endsWith(".fb2")) {
        let fileName = filePath.split("\\").pop()!.split("/").pop()!.slice(0, -4);
        if (!fileName.endsWith(".fb2")) {
            fileName += ".fb2";
        };
        fileData = new Uint8Array(encodeZIP({ [fileName]: fileData }));
    }
    return fileData;
};

export function openInitialFictionBook() {
    return new Promise<{ content: string, path: string } | void>((resolve, reject) => {
        if (isTauriMode) {
            invoke<string>('file_path').then(async path => {
                if (path) {
                    const fileData = (await readFile(path)).buffer;
                    const content = decodeXML(unzip(fileData));
                    resolve({ content, path });
                } else {
                    resolve();
                };
            }).catch((error) => {
                reject(error);
            });
        } else {
            resolve();
        };
    });
};

export function openFictionBookDialog() {
    return new Promise<{ content: string, path: string, handle?: FileSystemFileHandle }>((resolve, reject) => {
        if (isTauriMode) {
            const options: OpenDialogOptions = {
                multiple: false,
                directory: false,
                filters: [{
                    name: 'FictionBook',
                    extensions: ['fb2', 'fbz', 'fb2.zip']
                }]
            };

            openDialog(options).then(async path => {
                if (path) {
                    const fileData = (await readFile(path)).buffer;
                    const content = decodeXML(unzip(fileData));
                    resolve({ content, path, handle: undefined });
                };
            }).catch((error) => {
                reject(error);
            });
        } else {
            const options: FirstFileOpenOptions<false> = {
                description: 'FictionBook',
                extensions: ['.fb2', '.fbz', '.fb2.zip'],
                excludeAcceptAllOption: true
            };

            fileOpen(options).then(async file => {
                const fileData = await file.arrayBuffer();
                const content = decodeXML(unzip(fileData));
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
    return new Promise<{ content: string, path: string, handle?: FileSystemFileHandle }>((resolve, reject) => {
        if (isTauriMode) {
            const options: OpenDialogOptions = {
                multiple: false,
                directory: false,
                filters: [{
                    name: 'Изображения',
                    extensions: ['png', 'jpg', 'jpeg']
                }]
            };

            openDialog(options).then(async path => {
                if (path) {
                    const fileData = (await readFile(path)).buffer;
                    const fileType = imageFileType(fileData);
                    if (!fileType) {
                        throw new Error("Неподдерживаемый формат изображения");
                    };

                    const reader = new FileReader();
                    reader.readAsDataURL(new Blob([fileData], { type: fileType }));
                    reader.onerror = () => { reject(reader.error) };
                    reader.onload = () => {
                        const content = reader.result as string;
                        resolve({ content, path, handle: undefined });
                    };
                };
            }).catch((error) => {
                reject(error);
            });
        } else {
            const options: FirstFileOpenOptions<false> = {
                description: "Изображения",
                mimeTypes: ['image/png', 'image/jpeg'],
                excludeAcceptAllOption: true
            };

            fileOpen(options).then(async file => {
                if (!imageFileType(await file.arrayBuffer())) {
                    throw new Error("Неподдерживаемый формат изображения");
                };

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

export function saveFictionBookDialog(content: string, filePath: string, saveDirectly?: { fileHandle?: FileSystemFileHandle }) {
    return new Promise<{ path: string, handle?: FileSystemFileHandle }>((resolve, reject) => {
        if (isTauriMode) {
            const options: SaveDialogOptions = {
                defaultPath: filePath,
                filters: [{
                    name: 'FictionBook',
                    extensions: ['fb2', 'fbz', 'fb2.zip']
                }]
            };

            const method = saveDirectly ? Promise.resolve(filePath) : saveDialog(options);
            method.then(async (path) => {
                if (path) {
                    await writeFile(path, encode(content, path));
                    resolve({ path, handle: undefined });
                };
            });
        } else {
            let blob: Blob;
            if (saveDirectly?.fileHandle && !filePath.endsWith(".fb2")) {
                blob = new Blob([encode(content, filePath)], { type: 'application/zip' })
            } else {
                blob = new Blob([content], { type: 'application/fb2' });
            };

            const options: FirstFileSaveOptions = {
                fileName: filePath.endsWith(".fb2") ? filePath : filePath.slice(0, - 4) + (filePath.endsWith(".fbz") ? ".fb2" : ""),
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

export function saveImageDialog(content: string, filePath: string) {
    return new Promise<{ path: string, handle?: FileSystemFileHandle }>((resolve, reject) => {
        const image = parseDataURL(content);
        if (image && image.base64) {
            if (isTauriMode) {
                const options: SaveDialogOptions = {
                    defaultPath: filePath,
                    filters: [{
                        name: 'Изображения',
                        extensions: image.mime === "image/png" ? ['png'] : ['jpg', 'jpeg']
                    }]
                };

                saveDialog(options).then(async (path) => {
                    if (path) {
                        await writeFile(path, base64toData(image.data));
                        resolve({ path, handle: undefined });
                    };
                }).catch((error) => {
                    reject(error);
                });
            } else {
                const blob = new Blob([base64toData(image.data)], { type: image.mime });
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