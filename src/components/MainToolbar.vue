<template>
    <Toolbar style="border-radius: 0px">
        <template #start>
            <Button icon="pi pi-file" text @click="newFile" severity="secondary" v-tooltip="'Новый (Ctrl+N)'" />
            <Button icon="pi pi-file-import" text @click="openFile" severity="secondary"
                v-tooltip="'Открыть... (Ctrl+O)'" />
            <Button icon="pi pi-save" text @click="saveFile" severity="secondary" :disabled="!currentFilePath"
                v-tooltip="'Сохранить (Ctrl+S)'" v-if="saveButtonAvailable" />
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
import { supported as fileAPIsupported } from 'browser-fs-access';

import { openInitialFictionBook, openFictionBookDialog, saveFictionBookDialog } from '../fileAccess';
import { isTauriMode } from '../utils';
import fileBroker from '../fileBroker';

const emit = defineEmits(['loaded']);
const toast = useToast();

const currentFilePath = ref("");
const isDarkTheme = ref(false);
const saveButtonAvailable = fileAPIsupported || isTauriMode
let fileHandle: FileSystemFileHandle | undefined = undefined;

openInitialFictionBook().then(file => {
    if (file) {
        fileBroker.parse(file.content);
        currentFilePath.value = file.path;
    };
}).catch((error) => {
    toast.add({ severity: 'error', summary: 'Ошибка открытия файла', detail: error });
}).then(() => {
    emit("loaded");
});

watch(currentFilePath, (newPath) => {
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
    } else if (!event.shiftKey && event.code === "KeyS" && saveButtonAvailable) {
        saveFile();
    } else if (event.shiftKey && event.code === "KeyS") {
        saveFileAs();
    };
};
addEventListener("keydown", keyListener);

function newFile() {
    fileBroker.reset();
    currentFilePath.value = "";
    fileHandle = undefined;
};
function openFile() {
    openFictionBookDialog().then(file => {
        fileBroker.parse(file.content);
        currentFilePath.value = file.path;
        fileHandle = file.handle;
    }).catch((error) => {
        toast.add({ severity: 'error', summary: 'Ошибка открытия файла', detail: error });
    });
};
function saveFile() {
    if (currentFilePath) {
        saveFictionBookDialog(fileBroker.serialize(), currentFilePath.value, { fileHandle }).then(() => {
            toast.add({ severity: 'info', summary: 'Файл успешно сохранён', life: 3000 });
        }).catch((error) => {
            toast.add({ severity: 'error', summary: 'Ошибка сохранения файла', detail: error });
        });
    }
};
function saveFileAs() {
    saveFictionBookDialog(fileBroker.serialize(), currentFilePath.value).then(file => {
        currentFilePath.value = file.path;
        fileHandle = file.handle;
        toast.add({ severity: 'info', summary: 'Файл успешно сохранён', life: 3000 });
    }).catch((error) => {
        toast.add({ severity: 'error', summary: 'Ошибка сохранения файла', detail: error });
    });
};

function toggleDarkMode() {
    const element = document.querySelector('html') as HTMLElement;
    isDarkTheme.value = element.classList.toggle('my-app-dark');
};
</script>

<style></style>