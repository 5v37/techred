<template>
	<ContextMenu ref="contextMenu" :model="contextMenuItems" />

	<Dialog v-model:visible="nameDialog" modal header="Укажите новое имя раздела" :closable="false" class="t-ui-dialog">
		<InputText v-model.lazy.trim=bodyName autofocus style="width: 100%;" />
		<template #footer>
			<Button type="button" label="Отмена" severity="secondary" @click="nameDialog = false"></Button>
			<Button type="button" label="Ок" @click="changeName"></Button>
		</template>
	</Dialog>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from "vue";

import { ContextMenu, Dialog, Button, InputText } from "primevue";
import type { MenuItem } from "primevue/menuitem";
import type { TreeNode } from "primevue/treenode";

import type { EditorView } from "prosemirror-view";

import ui from "@/modules/ui";
import editorState from "@/modules/editorState";
import { SectionRange, sectionRangeByUID, excludeSection, includeSection, joinSection, moveUpSection, moveDownSection, deleteNodeByPos } from "@/modules/commands";
import { generateInsertMenuItems } from "@/modules/menuFactory";

let view: EditorView;
let range: SectionRange | undefined;
let startPos = 0;

const bodyName = ref("");
const nameDialog = ref(false);

function changeName() {
	let tr = view.state.tr;
	tr.setDocAttribute("name", bodyName.value);
	view.dispatch(tr);

	nameDialog.value = false;
}

const contextMenu = useTemplateRef("contextMenu");
const contextMenuItems = ref<MenuItem[]>([]);

const sectionItems = () => [
	{
		label: "Указать идентификатор",
		icon: "pi pi-hashtag",
		disabled: range === undefined,
		command: () => {
			if (range) {
				ui.openElementIdDialog(view.state, view.dispatch, range.from, range.node.attrs.id);
			};
		}
	},
	{
		separator: true
	},
	{
		label: "Исключить",
		icon: "pi pi-angle-double-left",
		disabled: !excludeSection(range)(view.state),
		command: () => excludeSection(range)(view.state, view.dispatch)
	},
	{
		label: "Включить",
		icon: "pi pi-angle-double-right",
		disabled: !includeSection(range)(view.state),
		command: () => includeSection(range)(view.state, view.dispatch)
	},
	{
		label: "Объединить",
		icon: "pi pi-chevron-circle-up",
		disabled: !joinSection(range)(view.state),
		command: () => joinSection(range)(view.state, view.dispatch)
	},
	{
		label: "Вставить",
		icon: "pi pi-plus-circle",
		disabled: range === undefined,
		items: generateInsertMenuItems(view, range!.node, startPos)
	},
	{
		label: "Сместить вверх",
		icon: "pi pi-arrow-up",
		disabled: !moveUpSection(range)(view.state),
		command: () => moveUpSection(range)(view.state, view.dispatch)
	},
	{
		label: "Сместить вниз",
		icon: "pi pi-arrow-down",
		disabled: !moveDownSection(range)(view.state),
		command: () => moveDownSection(range)(view.state, view.dispatch)
	},
	{
		separator: true
	},
	{
		label: "Удалить",
		icon: "pi pi-trash",
		disabled: !(range?.node && deleteNodeByPos(range.node, range.from)(view.state)),
		command: () => deleteNodeByPos(range!.node, range!.from)(view.state, view.dispatch)
	}
];

const bodyItems = () => [
	{
		label: "Указать имя",
		icon: "pi pi-tag",
		command: () => nameDialog.value = true
	},
	{
		separator: true
	},
	{
		label: "Вставить",
		icon: "pi pi-plus-circle",
		// disabled: range === undefined,
		items: generateInsertMenuItems(view, view.state.doc, startPos)
	}
];

function show(event: Event, node: TreeNode) {
	const target = editorState.views[node.data || node.key];
	if (target) {
		view = target;
		if (node.data) {
			range = sectionRangeByUID(node.key, view.state);
			startPos = range ? range.from : 0;
			contextMenuItems.value = sectionItems();
		} else {
			bodyName.value = view.state.doc.attrs.name;
			startPos = 0;
			contextMenuItems.value = bodyItems();
		};
		contextMenu.value!.show(event);
	} else {
		event.stopPropagation();
		event.preventDefault();
	};
};

defineExpose({ show });
</script>