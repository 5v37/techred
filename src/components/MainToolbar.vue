<template>
    <Toolbar style="border-radius: 0px">
        <template #start>
            <Button icon="pi pi-file" text @click="newFile" severity="secondary" v-tooltip="'Новый (Ctrl+N)'" />
            <Button icon="pi pi-file-import" text @click="openFile" severity="secondary"
                v-tooltip="'Открыть... (Ctrl+O)'" />
            <Button icon="pi pi-save" text @click="saveFile" severity="secondary" :disabled="!curentFilePath"
                v-tooltip="'Сохранить (Ctrl+S)'" />
            <Button icon="pi pi-file-export" text @click="saveFileAs" severity="secondary"
                v-tooltip="'Сохранить как... (Ctrl+Shift+S)'" />
        </template>
        <template #end>
            <Button text severity="secondary" @click="toggleDarkMode"
                v-tooltip="!isDarkTheme ? 'Тёмный режим' : 'Светлый режим'">
                <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
            </Button>

        </template>

    </Toolbar>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import { Toolbar, Button, useToast } from 'primevue';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { open as openDialog, OpenDialogOptions, save as saveDialog, SaveDialogOptions } from '@tauri-apps/plugin-dialog';

import { isTauriMode, getFilePath, readTextFile, writeTextFile } from '../utils';
import fileBroker from '../fileBroker';

const emit = defineEmits(['loaded']);

const curentFilePath = ref("");
const isDarkTheme = ref(false);
const toast = useToast();
const fileOptions: FilePickerOptions = {
    types: [{
        description: "FictionBook",
        accept: {
            "application/fb2": ".fb2"
        }
    }],
    excludeAcceptAllOption: true
};

if (isTauriMode) {
    getFilePath().then(async (filePath) => {
        if (filePath) {
            const xml = await readTextFile(filePath);
            fileBroker.parse(xml);
            curentFilePath.value = filePath;
        };
    }).catch((error) => {
        toast.add({ severity: 'error', summary: 'Ошибка открытия файла', detail: error });
    }).then(() => {
        emit("loaded");
    });
} else {
    emit("loaded");
};

watch(curentFilePath, (newPath) => {
    if (isTauriMode) {
        const fileName = !newPath ? "Новый" : newPath;
        getCurrentWindow().setTitle(`${fileName} - Техред`);
    };
});

function keyListener(event: KeyboardEvent) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) {
        return;
    };

    if (!event.shiftKey && event.code === "KeyN") {
        newFile();
    } else if (!event.shiftKey && event.code === "KeyO") {
        openFile();
    } else if (!event.shiftKey && event.code === "KeyS") {
        saveFile();
    } else if (event.shiftKey && event.code === "KeyS") {
        saveFileAs();
    };
};
addEventListener("keydown", keyListener);

function newFile() {
    fileBroker.reset();
    curentFilePath.value = "";
};
function openFile() {
    if (isTauriMode) {
        const options: OpenDialogOptions = {
            multiple: false,
            directory: false,
            filters: [{
                name: 'FictionBook',
                extensions: ['fb2', 'fbz', 'fb2.zip']
            }]
        };

        openDialog(options).then(async filePath => {
            if (filePath) {
                const xml = await readTextFile(filePath);
                fileBroker.parse(xml);
                curentFilePath.value = filePath;
            };
        }).catch((error) => {
            toast.add({ severity: 'error', summary: 'Ошибка открытия файла', detail: error });
        });
    } else {
        showOpenFilePicker(fileOptions).then(async (fileHandle) => {
            const file = await fileHandle[0].getFile();
            const fileContent = await file.text();
            fileBroker.parse(fileContent);
        });
    };
};
function saveFile() {
    if (curentFilePath) {
        writeTextFile(curentFilePath.value, fileBroker.serialize()).then(() => {
            toast.add({ severity: 'info', summary: 'Файл успешно сохранён', life: 5000 });
        }).catch((error) => {
            toast.add({ severity: 'error', summary: 'Ошибка сохранения файла', detail: error });
        });
    }
};
function saveFileAs() {
    if (isTauriMode) {
        const options: SaveDialogOptions = {
            filters: [{
                name: 'FictionBook',
                extensions: ['fb2', 'fbz', 'fb2.zip']
            }],
            defaultPath: curentFilePath.value
        };

        saveDialog(options).then(async filePath => {
            if (filePath) {
                await writeTextFile(filePath, fileBroker.serialize());
                curentFilePath.value = filePath;
                toast.add({ severity: 'info', summary: 'Файл успешно сохранён', life: 5000 });
            };
        }).catch((error) => {
            toast.add({ severity: 'error', summary: 'Ошибка сохранения файла', detail: error });
        });
    } else {
        showSaveFilePicker(fileOptions).then(async (fileHandle) => {
            const writableStream = await fileHandle.createWritable();
            await writableStream.write(fileBroker.serialize());
            await writableStream.close();
        });
    };
};
function toggleDarkMode() {
    const element = document.querySelector('html') as HTMLElement;
    isDarkTheme.value = element.classList.toggle('my-app-dark');
};
</script>

<style></style>