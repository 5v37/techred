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
import { ref, useTemplateRef, watchEffect } from "vue";

import { Toolbar, Button } from "primevue";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { supported as fileAPIsupported } from "browser-fs-access";

import Settings from "@/components/Settings.vue";
import fb2Mapper from "@/modules/fb2Mapper";
import { openInitialFictionBook, openFictionBookDialog, saveFictionBookDialog } from "@/modules/fileAccess";
import { openFileError, saveFileError, saveFileInfo, UnexpectedError } from "@/modules/notifications";
import { isTauriMode } from "@/modules/utils";
import modificationTracker from "@/modules/modificationTracker";
import ui from "@/modules/ui";

const emit = defineEmits(["loaded"]);

const currentFilePath = ref("");
const saveButtonAvailable = isTauriMode || fileAPIsupported;
let fileHandle: FileSystemFileHandle | undefined;

const settings = useTemplateRef<InstanceType<typeof Settings>>("settings");
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

watchEffect(() => {
	const title = `${modificationTracker.docModified.value ? "*" : ""}${!currentFilePath.value ? "Новый" : currentFilePath.value} - Техред`;
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

if (isTauriMode) {
	getCurrentWindow().onCloseRequested(async (event) => {
		const confirmed = await confirmDiscardChanges();
		if (!confirmed) {
			event.preventDefault();
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
};

function confirmDiscardChanges(): Promise<boolean> {
	if (!modificationTracker.docModified.value) {
		return Promise.resolve(true);
	}

	return ui.openSaveChangesDialog().then((choice) => {
		if (choice === "save") {
			const saveDirectly = currentFilePath.value ? { fileHandle } : undefined;
			return saveFictionBookDialog(fb2Mapper.serialize(), currentFilePath.value || "Новый", saveDirectly).then((file) => {
				currentFilePath.value = file.path;
				fileHandle = file.handle;
				modificationTracker.reset(false);
				saveFileInfo();
				return true;
			}).catch(error => {
				saveFileError(error);
				return false;
			});
		} else if (choice === "discard") {
			return true;
		} else {
			return false;
		};
	}).catch(() => false);
}

function newFile() {
	confirmDiscardChanges().then((confirmed) => {
		if (!confirmed) return;

		return fb2Mapper.reset().then(() => {
			currentFilePath.value = "";
			fileHandle = undefined;
			modificationTracker.reset(true);
		});
	});
}

function openFile() {
	confirmDiscardChanges().then((confirmed) => {
		if (!confirmed) return;

		return openFictionBookDialog().then(async (file) => {
			await fb2Mapper.parse(file.content);
			currentFilePath.value = file.path;
			fileHandle = file.handle;
			modificationTracker.reset(true);
		}).catch((error) => {
			openFileError(error);
			newFile();
		});
	});
}

function saveFile() {
	if (currentFilePath.value && saveButtonAvailable) {
		saveFictionBookDialog(fb2Mapper.serialize(), currentFilePath.value, { fileHandle }).then(() => {
			modificationTracker.reset(false);
			saveFileInfo();
		}).catch(error => saveFileError(error));
	};
}

function saveFileAs() {
	saveFictionBookDialog(fb2Mapper.serialize(), currentFilePath.value || "Новый").then((file) => {
		currentFilePath.value = file.path;
		fileHandle = file.handle;
		modificationTracker.reset(false);
		saveFileInfo();
	}).catch(error => saveFileError(error));
}
</script>

<style></style>