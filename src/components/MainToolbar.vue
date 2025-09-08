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
            <Button icon="pi pi-cog" severity="secondary" text @click="showSettings" v-tooltip="'Настройки'" />
            <Settings ref="settings" />
        </template>
    </Toolbar>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue';

import { Toolbar, Button } from 'primevue';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { supported as fileAPIsupported } from 'browser-fs-access';

import Settings from './Settings.vue';
import fileBroker from '../fileBroker';
import { openInitialFictionBook, openFictionBookDialog, saveFictionBookDialog } from '../fileAccess';
import { openFileError, saveFileError, saveFileInfo, UnexpectedError } from '../notification';
import { isTauriMode } from '../utils';

const emit = defineEmits(['loaded']);

const currentFilePath = ref("");
const saveButtonAvailable = isTauriMode || fileAPIsupported;
let fileHandle: FileSystemFileHandle | undefined = undefined;

const settings = useTemplateRef<InstanceType<typeof Settings>>('settings');
const showSettings = () => { settings.value?.show() };

openInitialFictionBook().then(file => {
    if (file) {
        fileBroker.parse(file.content);
        currentFilePath.value = file.path;
    };
}).catch((error) => {
    openFileError(error);
}).then(() => {
    emit("loaded");
});

if (isTauriMode) {
    watch(currentFilePath, (newPath) => {
        const fileName = !newPath ? "Новый" : newPath;
        getCurrentWindow().setTitle(`${fileName} - Техред`);
    });
};

addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.defaultPrevented || !(event.ctrlKey || event.metaKey) || event.altKey) {
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
    } else {
        return;
    };

    event.preventDefault();
});
addEventListener("error", UnexpectedError);

function newFile() {
    fileBroker.reset();
    currentFilePath.value = "";
    fileHandle = undefined;
}
function openFile() {
    openFictionBookDialog().then(file => {
        fileBroker.parse(file.content);
        currentFilePath.value = file.path;
        fileHandle = file.handle;
    }).catch((error) => openFileError(error));
}
function saveFile() {
    if (currentFilePath) {
        saveFictionBookDialog(fileBroker.serialize(), currentFilePath.value, { fileHandle }).then(() => {
            saveFileInfo();
        }).catch((error) => saveFileError(error));
    }
}
function saveFileAs() {
    saveFictionBookDialog(fileBroker.serialize(), currentFilePath.value).then(file => {
        currentFilePath.value = file.path;
        fileHandle = file.handle;
        saveFileInfo();
    }).catch((error) => saveFileError(error));
}
</script>

<style></style>