<template>
	<Dialog v-model:visible=idDialog modal :closable="false" :close-on-escape="false" class="t-ui-dialog"
		header="Укажите новый идентификатор">
		<InputText v-model.lazy=newId v-keyfilter=NCNameFilter autofocus style="width: 100%;" />
		<template #footer>
			<Message v-if="invalidId" severity="error" variant="simple" style="margin-inline-end: auto;">
				{{ errorMessage }}
			</Message>
			<Button type="button" label="Отмена" severity="secondary" @click="closeDialog"></Button>
			<Button type="button" label="Ок" :disabled="invalidId" @click="changeId"></Button>
		</template>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Dialog, Button, InputText, Message } from 'primevue';
import { EditorView } from 'prosemirror-view';

import { NCNameFilter } from '../utils';
import editorState from '../editorState';

let docView: EditorView, curView: EditorView | undefined;
let posNode: number;
let oldId: string;
let ids: Set<string>;

const idDialog = ref(false);
const newId = ref("");
const errorMessage = ref("");
const invalidId = computed(() => {
	if (newId.value && !NCNameFilter.pattern.test(newId.value)) {
		errorMessage.value = "Значение некорректно";
		return true;
	};
	if (newId.value !== oldId && ids.has(newId.value)) {
		errorMessage.value = "Значение не уникально";
		return true;
	};
	return false;
});

function keyListener(event: KeyboardEvent) {
	if (event.code === "Escape") {
		closeDialog();
	} else if (event.code === "Enter") {
		changeId();
	} else {
		return;
	};
	event.preventDefault();
}

function openDialog(view: EditorView, pos: number, id: string) {
	docView = view;
	posNode = pos;
	oldId = id;
	newId.value = id;
	ids = editorState.getIds();

	curView = docView.hasFocus() ? docView : findFocusedView();
	if (curView) {
		curView.dom.blur();
	};
	idDialog.value = true;
	addEventListener("keydown", keyListener);
}

function closeDialog() {
	if (curView) {
		editorState.cancelEditorScroll = true;
		curView.dom.focus({ preventScroll: true });
	};
	idDialog.value = false;
	removeEventListener("keydown", keyListener);
}

function changeId() {
	if (invalidId.value) {
		return;
	};
	if ((newId.value || oldId) && newId.value !== oldId) {
		let tr = docView.state.tr;
		const pos = posNode;
		if (pos !== undefined) {
			tr.setNodeAttribute(pos, "inid", newId.value)
			docView.dispatch(tr);
		};
	};
	closeDialog();
}

function findFocusedView() {
	console.log(Object.keys(editorState.bodies));
	for (const body of Object.keys(editorState.bodies)) {
		if (editorState.views[body].hasFocus()) {
			return editorState.views[body];
		}
	};
}

defineExpose({ openDialog });
</script>

<style></style>