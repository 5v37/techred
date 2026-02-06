<template>
	<Dialog v-model:visible=visible modal :closable="false" :close-on-escape="false" class="t-ui-dialog"
		header="Укажите новый идентификатор">
		<InputText v-model.lazy=newId v-keyfilter=NCNameFilter autofocus style="width: 100%;" />
		<template #footer>
			<Message v-if="idValidation.invalid" severity="error" variant="simple" style="margin-inline-end: auto;">
				{{ idValidation.error }}
			</Message>
			<Button type="button" label="Отмена" severity="secondary" @click="closeDialog"></Button>
			<Button type="button" label="Ок" :disabled="idValidation.invalid" @click="changeId"></Button>
		</template>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Dialog, Button, InputText, Message } from "primevue";
import type { EditorState, Transaction } from "prosemirror-state";

import { endHistoryGroup, startHistoryGroup } from "@/extensions/sharedHistory";
import { NCNameFilter, validateId, getIds } from "@/modules/idManager";
import editorState from "@/modules/editorState";
import ui from "@/modules/ui";

let ids: Set<string>;
let params: {
	state: EditorState,
	dispatch: (tr: Transaction) => void,
	pos: number,
	id: string,
	key: string
};

const visible = ref(false);
const newId = ref("");
const idValidation = computed(() => validateId(newId.value, ids));

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
	ids = getIds(params.id);

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
	if (idValidation.value.invalid) {
		return;
	};
	if ((newId.value || params.id) && newId.value !== params.id) {
		startHistoryGroup();
		let tr = params.state.tr;
		tr.setNodeAttribute(params.pos, params.key, newId.value || undefined);

		const bodyKey = params.state.doc.attrs.body;
		if (bodyKey && params.id) {
			const oldHref = "#" + params.id, newHref = "#" + newId.value;
			replaceLinkHrefs(params.state, tr, oldHref, newHref);

			params.dispatch(tr);

			for (let view of Object.values(editorState.views)) {
				const relatedBodyKey = view.state.doc.attrs.body;
				if (relatedBodyKey && relatedBodyKey !== bodyKey) {
					let relatedTr = view.state.tr;
					if (replaceLinkHrefs(view.state, relatedTr, oldHref, newHref)) {
						view.dispatch(relatedTr);
					};
				};
			};
		} else {
			params.dispatch(tr);
		};

		endHistoryGroup();
	};
	closeDialog();
}

function replaceLinkHrefs(state: EditorState, tr: Transaction, oldHref: string, newHref: string) {
	const noteMarkType = state.schema.marks.note;
	const linkMarkType = state.schema.marks.a;

	let found = false;
	state.doc.descendants((node, pos) => {
		if (node.marks.length === 0) return;

		for (const mark of node.marks) {
			if ((mark.type === linkMarkType || mark.type === noteMarkType) && mark.attrs.href === oldHref) {
				tr.removeMark(pos, pos + node.nodeSize, mark);
				tr.addMark(pos, pos + node.nodeSize, mark.type.create({ ...mark.attrs, href: newHref }));
				found = true;
			}
		};
	});

	return found;
}
</script>

<style></style>