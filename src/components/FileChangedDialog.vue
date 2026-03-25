<template>
	<Dialog v-model:visible=visible modal :closable="false" :close-on-escape="false" class="t-ui-dialog">
		<template #header>
			<span class="p-dialog-title">Документ был изменен другим приложением.<br />Хотите его обновить?</span>
		</template>
		<template #footer>
			<Button type="button" label="Отмена" severity="secondary" @click="resolve('cancel')"></Button>
			<Button type="button" label="Обновить" autofocus @click="resolve('reload')"></Button>
		</template>
	</Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Dialog, Button } from "primevue";
import ui from "@/modules/ui";

const visible = ref(false);
let resolvePromise: ((result: "reload" | "cancel") => void) | null = null;

ui.openFileChangedDialog = openDialog;

function keyListener(event: KeyboardEvent) {
	if (event.defaultPrevented) {
		return;
	};

	if (event.code === "Escape") {
		resolve("cancel");
	} else if (event.code === "Enter") {
		resolve("reload");
	} else {
		return;
	};
	event.preventDefault();
}

function openDialog(): Promise<"reload" | "cancel"> {
	visible.value = true;
	addEventListener("keydown", keyListener);
	return new Promise((resolve) => {
		resolvePromise = resolve;
	});
}

function resolve(result: "reload" | "cancel") {
	if (resolvePromise) {
		resolvePromise(result);
		resolvePromise = null;
	}
	visible.value = false;
	removeEventListener("keydown", keyListener);
}
</script>