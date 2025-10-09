import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, OpenDialogOptions, save as saveDialog, SaveDialogOptions } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { fileOpen, fileSave, FirstFileOpenOptions, FirstFileSaveOptions, supported as fileAPIsupported } from "browser-fs-access";

import { base64toData, decodeXML, imageFileType, isTauriMode, parseDataURL } from "@/modules/utils";
import { unpack, pack } from "@/modules/zip";

async function encode(content: string, filePath: string) {
    let fileData = new TextEncoder().encode(content);
    if (!filePath.endsWith(".fb2")) {
        let fileName = filePath.split("\\").pop()!.split("/").pop()!.slice(0, -4);
        if (!fileName.endsWith(".fb2")) {
            fileName += ".fb2";
        };
        fileData = new Uint8Array(await pack(fileData.buffer, fileName));
    }
    return fileData;
};

export function openInitialFictionBook() {
    return new Promise<{ content: string, path: string } | void>((resolve, reject) => {
        if (isTauriMode) {
            invoke<string>('file_path').then(async path => {
                if (path) {
                    const fileData = (await readFile(path)).buffer;
                    const content = decodeXML(await unpack(fileData));
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
                    const content = decodeXML(await unpack(fileData));
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
                const content = decodeXML(await unpack(fileData));
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
    return new Promise<{ content: string, name: string, handle?: FileSystemFileHandle }>((resolve, reject) => {
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
                    const fileName = path.split("\\").pop()!.split("/").pop()!;

                    const reader = new FileReader();
                    reader.readAsDataURL(new Blob([fileData], { type: fileType }));
                    reader.onerror = () => { reject(reader.error) };
                    reader.onload = () => {
                        const content = reader.result as string;
                        resolve({ content, name: fileName, handle: undefined });
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
                    resolve({ content, name: file.name, handle: file.handle });
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
                    await writeFile(path, await encode(content, path));
                    resolve({ path, handle: undefined });
                };
            }).catch((error) => {
                reject(error);
            });
        } else {
            if (fileAPIsupported) {
                const options: SaveFilePickerOptions = {
                    suggestedName: filePath,
                    types: [{
                        description: "FictionBook",
                        accept: {
                            "application/fb2": [".fb2"],
                            "application/fb2+zip": [".fbz", ".fb2.zip"]
                        },
                    }],
                    excludeAcceptAllOption: true
                };

                const method = saveDirectly?.fileHandle ? Promise.resolve(saveDirectly.fileHandle) : showSaveFilePicker(options);
                method.then(async handle => {
                    const writableStream = await handle.createWritable();
                    await writableStream.write(await encode(content, handle.name));
                    await writableStream.close();
                    resolve({ path: handle.name, handle });
                }).catch((error) => {
                    if (error.name !== 'AbortError') {
                        reject(error);
                    };
                });
            } else {
                const blob = new Blob([content], { type: 'application/fb2' });
                
                let ext = filePath.slice(-4).toLowerCase();
                let fileName = filePath;
                if (ext === ".zip" || ext === ".fbz") {
                    fileName = fileName.slice(0, - 4);
                    ext = fileName.slice(-4).toLowerCase();
                };
                const options: FirstFileSaveOptions = {
                    fileName: ext === ".fb2" ? fileName : fileName + ".fb2",
                    description: 'FictionBook',
                    extensions: ['.fb2'],
                    excludeAcceptAllOption: true
                };

                fileSave(blob, options).then((handle) => {
                    if (handle) {
                        resolve({ path: handle.name, handle });
                    };
                }).catch(error => reject(error));
            };
        };
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