<template>
	<Dialog v-model:visible="visible" modal :closable="false" class="t-ui-dialog" header="Укажите новую подпись">
		<Textarea v-model.trim="newCaption" autofocus autoResize rows="1" fluid />
		<template #footer>
			<Button type="button" label="Отмена" severity="secondary" @click="closeDialog"></Button>
			<Button type="button" label="Ок" @click="changeCaption"></Button>
		</template>
	</Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { Dialog, Button, Textarea } from "primevue";
import { EditorState, Transaction } from "prosemirror-state";
import editorState from "@/modules/editorState";
import ui from "@/modules/ui";

const visible = ref(false);
const newCaption = ref("");

let params: {
	state: EditorState,
	dispatch: (tr: Transaction) => void,
	pos: number,
	caption: string
};

ui.openImageCaptionDialog = openDialog;

function keyListener(event: KeyboardEvent) {
	if (event.defaultPrevented) {
		return;
	};

	if (event.code === "Escape") {
		closeDialog();
	} else if (event.code === "Enter") {
		changeCaption();
	} else {
		return;
	};
	event.preventDefault();
}

function changeCaption() {
	if ((newCaption.value || params.caption) && newCaption.value !== params.caption) {
		let tr = params.state.tr;
		tr.setNodeAttribute(params.pos, "title", newCaption.value);
		params.dispatch(tr);
	};
	closeDialog();
}

function openDialog(state: EditorState, dispatch: (tr: Transaction) => void, pos: number, caption: string) {
	params = { state, dispatch, pos, caption };
	newCaption.value = caption;

	editorState.saveViewFocus();
	visible.value = true;
	addEventListener("keydown", keyListener);
}

function closeDialog() {
	editorState.restoreViewFocus();
	visible.value = false;
	removeEventListener("keydown", keyListener);
}

defineExpose({ openDialog });
</script>