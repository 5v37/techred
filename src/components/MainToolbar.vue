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
import fb2Mapper from '../fb2Mapper';
import { openInitialFictionBook, openFictionBookDialog, saveFictionBookDialog } from '../fileAccess';
import { openFileError, saveFileError, saveFileInfo, UnexpectedError } from '../notification';
import { isTauriMode } from '../utils';

const emit = defineEmits(['loaded']);

const currentFilePath = ref("");
const saveButtonAvailable = isTauriMode || fileAPIsupported;
let fileHandle: FileSystemFileHandle | undefined = undefined;

const settings = useTemplateRef<InstanceType<typeof Settings>>('settings');
const showSettings = () => { settings.value?.show() };

openInitialFictionBook().then(async file => {
    if (file) {
        await fb2Mapper.parse(file.content);
        currentFilePath.value = file.path;
    };
}).catch((error) => {
    openFileError(error);
    newFile();
}).then(() => {
    emit("loaded");
});

watch(currentFilePath, (newPath) => {
    const title = `${!newPath ? "Новый" : newPath} - Техред`;
    if (isTauriMode) {
        getCurrentWindow().setTitle(title);
    } else {
        document.title = title;
    };
});

addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.defaultPrevented || !(event.ctrlKey || event.metaKey) || event.altKey) {
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
    } else {
        return;
    };

    event.preventDefault();
});
addEventListener("error", UnexpectedError);

function newFile() {
    fb2Mapper.reset().then(() => {
        currentFilePath.value = "";
        fileHandle = undefined;
    });
}
function openFile() {
    openFictionBookDialog().then(async file => {
        await fb2Mapper.parse(file.content);
        currentFilePath.value = file.path;
        fileHandle = file.handle;
    }).catch((error) => {
        openFileError(error);
        newFile();
    });
}
function saveFile() {
    if (currentFilePath.value && saveButtonAvailable) {
        saveFictionBookDialog(fb2Mapper.serialize(), currentFilePath.value, { fileHandle }).then(() => {
            saveFileInfo();
        }).catch(error => saveFileError(error));
    };
}
function saveFileAs() {
    saveFictionBookDialog(fb2Mapper.serialize(), currentFilePath.value || "Новый").then(file => {
        currentFilePath.value = file.path;
        fileHandle = file.handle;
        saveFileInfo();
    }).catch(error => saveFileError(error));
}
</script>

<style></style>