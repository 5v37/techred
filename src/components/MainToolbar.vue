<template>
	<Toolbar style="border-radius: 0px">
		<template #start>
			<Button icon="pi pi-file" text @click="newFile" severity="secondary" v-tooltip="'Новый (Ctrl+N)'" />
			<Button icon="pi pi-file-import" text @click="openFile" severity="secondary"
				v-tooltip="'Открыть... (Ctrl+O)'" />
			<Button icon="pi pi-save" text @click="saveFile" severity="secondary" :disabled="!currentFile"
				v-tooltip="'Сохранить (Ctrl+S)'" v-if="saveFileAvailable" />
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
import { useTemplateRef } from "vue";
import { Toolbar, Button } from "primevue";

import Settings from "@/components/Settings.vue";
import { newFile, openFile, saveFile, saveFileAs, saveFileAvailable, currentFile } from "@/modules/documentSession";

const settings = useTemplateRef<InstanceType<typeof Settings>>("settings");
const showSettings = () => { settings.value?.show() };

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
</script>