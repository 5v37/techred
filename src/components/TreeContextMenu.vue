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

import ui from "@/modules/ui";
import editorState from "@/modules/editorState";
import { SectionRange, sectionRangeByUID, excludeSection, includeSection, joinSection, moveUpSection, moveDownSection, deleteNodeByPos } from "@/modules/commands";
import { generateInsertMenuItems } from "@/modules/menuFactory";
import { findNodeWithPosByAttr, type NodeWithPos } from "@/modules/transform";
import { ViewManager } from "@/modules/viewManager";

let editor: ViewManager;
let range: SectionRange | undefined;
let startPos = 0;

let body: NodeWithPos = undefined;
const bodyName = ref("");
const nameDialog = ref(false);

function changeName() {
	let tr = editor.state.tr;
	tr.setNodeAttribute(body!.pos, "name", bodyName.value);
	editor.dispatch(tr);

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
				ui.openElementIdDialog(editor.state, editor.dispatch, range.from, range.node.attrs.id);
			};
		}
	},
	{
		separator: true
	},
	{
		label: "Исключить",
		icon: "pi pi-angle-double-left",
		disabled: !excludeSection(range)(editor.state),
		command: () => excludeSection(range)(editor.state, editor.dispatch)
	},
	{
		label: "Включить",
		icon: "pi pi-angle-double-right",
		disabled: !includeSection(range)(editor.state),
		command: () => includeSection(range)(editor.state, editor.dispatch)
	},
	{
		label: "Объединить",
		icon: "pi pi-chevron-circle-up",
		disabled: !joinSection(range)(editor.state),
		command: () => joinSection(range)(editor.state, editor.dispatch)
	},
	{
		label: "Вставить",
		icon: "pi pi-plus-circle",
		disabled: range === undefined,
		items: generateInsertMenuItems(editor, range!.node, startPos)
	},
	{
		label: "Сместить вверх",
		icon: "pi pi-arrow-up",
		disabled: !moveUpSection(range)(editor.state),
		command: () => moveUpSection(range)(editor.state, editor.dispatch)
	},
	{
		label: "Сместить вниз",
		icon: "pi pi-arrow-down",
		disabled: !moveDownSection(range)(editor.state),
		command: () => moveDownSection(range)(editor.state, editor.dispatch)
	},
	{
		separator: true
	},
	{
		label: "Удалить",
		icon: "pi pi-trash",
		disabled: !(range?.node && deleteNodeByPos(range.node, range.from)(editor.state)),
		command: () => deleteNodeByPos(range!.node, range!.from)(editor.state, editor.dispatch)
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
		disabled: body === undefined,
		items: generateInsertMenuItems(editor, body!.node, body!.pos)
	}
];

function show(event: Event, node: TreeNode) {
	if (node.type) {
		editor = editorState.viewManagers.find(m => m.id === "mainEditor")!;
		if (node.type === "section") {
			range = sectionRangeByUID(node.key, editor.state);
			startPos = range ? range.from : 0;
			contextMenuItems.value = sectionItems();
		} else {
			body = findNodeWithPosByAttr(editor.state.doc, "uid", node.key);
			bodyName.value = body?.node.attrs.name;
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