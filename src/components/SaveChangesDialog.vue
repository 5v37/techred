<template>
	<Dialog v-model:visible=visible modal :closable="false" :close-on-escape="false" class="t-ui-dialog"
		header="Хотите сохранить изменения в документе?">
		<template #footer>
			<Button type="button" label="Отмена" severity="secondary" @click="resolve('cancel')"></Button>
			<Button type="button" label="Не сохранять" severity="secondary" @click="resolve('discard')"></Button>
			<Button type="button" label="Сохранить" autofocus @click="resolve('save')"></Button>
		</template>
	</Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Dialog, Button } from "primevue";
import ui from "@/modules/ui";

const visible = ref(false);
let resolvePromise: ((result: "save" | "discard" | "cancel") => void) | null = null;

ui.openSaveChangesDialog = openDialog;

function keyListener(event: KeyboardEvent) {
	if (event.defaultPrevented) {
		return;
	};

	if (event.code === "Escape") {
		resolve("cancel");
	} else if (event.code === "Enter") {
		resolve("save");
	} else {
		return;
	};
	event.preventDefault();
}

function openDialog(): Promise<"save" | "discard" | "cancel"> {
	visible.value = true;
	addEventListener("keydown", keyListener);
	return new Promise((resolve) => {
		resolvePromise = resolve;
	});
}

function resolve(result: "save" | "discard" | "cancel") {
	if (resolvePromise) {
		resolvePromise(result);
		resolvePromise = null;
	}
	visible.value = false;
	removeEventListener("keydown", keyListener);
}
</script>

<style></style>