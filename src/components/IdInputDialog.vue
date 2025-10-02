<template>
	<Dialog v-model:visible=visible modal :closable="false" :close-on-escape="false" class="t-ui-dialog"
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
import { EditorState, Transaction } from 'prosemirror-state';

import { NCNameFilter } from '../utils';
import editorState from '../editorState';
import ui from '../ui';

let params: {
	state: EditorState,
	dispatch: (tr: Transaction) => void,
	pos: number,
	id: string,
	key: string
};
let ids: Set<string>;

const visible = ref(false);
const newId = ref("");
const errorMessage = ref("");
const invalidId = computed(() => {
	if (newId.value && !NCNameFilter.pattern.test(newId.value)) {
		errorMessage.value = "Значение некорректно";
		return true;
	};
	if (newId.value !== params.id && ids.has(newId.value)) {
		errorMessage.value = "Значение не уникально";
		return true;
	};
	return false;
});

ui.openIdInputDialog = openDialog;

function keyListener(event: KeyboardEvent) {
	if (event.defaultPrevented) {
        return;
    };

	if (event.code === "Escape") {
		closeDialog();
	} else if (event.code === "Enter") {
		changeId();
	} else {
		return;
	};
	event.preventDefault();
}

function openDialog(state: EditorState, dispatch: (tr: Transaction) => void, pos: number, id: string, key = "id") {
	params = { state, dispatch, pos, id, key };
	newId.value = params.id;
	ids = editorState.getIds();

	editorState.saveViewFocus();
	visible.value = true;
	addEventListener("keydown", keyListener);
}

function closeDialog() {
	editorState.restoreViewFocus();
	visible.value = false;
	removeEventListener("keydown", keyListener);
}

function changeId() {
	if (invalidId.value) {
		return;
	};
	if ((newId.value || params.id) && newId.value !== params.id) {
		let tr = params.state.tr;
		tr.setNodeAttribute(params.pos, params.key, newId.value || undefined)
		params.dispatch(tr);
	};
	closeDialog();
}
</script>

<style></style>