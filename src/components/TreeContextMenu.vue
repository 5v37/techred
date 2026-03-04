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
import imageStore from "@/modules/imageStore";
import { SectionRange, sectionRangeByUID, excludeSection, includeSection, joinSection, moveUpSection, moveDownSection, addNodeByPos, deleteNodeByPos } from "@/modules/commands";
import { openImageDialog } from "@/modules/fileAccess";
import { openFileError } from "@/modules/notifications";

let view: EditorView;
let nodeTypes: typeof view.state.schema.nodes;
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
		items: [
			{
				label: "Заголовок",
				disabled: !addNodeByPos(range!.node, nodeTypes.title, startPos)(view.state),
				command: () => addNodeByPos(range!.node, nodeTypes.title, startPos)(view.state, view.dispatch)
			},
			{
				label: "Изображение",
				disabled: !addNodeByPos(range!.node, nodeTypes.image, startPos)(view.state),
				command: () =>
					openImageDialog().then(file => {
						const imgid = imageStore.addAsDataURL(file.name, file.content);
						if (imgid) {
							const image = nodeTypes.image.create({ imgid });
							addNodeByPos(range!.node, nodeTypes.image, startPos, image)(view.state, view.dispatch);
						};
					}).catch((error) => openFileError(error))
			},
			{
				label: "Эпиграф",
				disabled: !addNodeByPos(range!.node, nodeTypes.epigraph, startPos)(view.state),
				command: () => addNodeByPos(range!.node, nodeTypes.epigraph, startPos)(view.state, view.dispatch)
			},
			{
				label: "Аннотацию",
				disabled: !addNodeByPos(range!.node, nodeTypes.annotation, startPos)(view.state),
				command: () => addNodeByPos(range!.node, nodeTypes.annotation, startPos)(view.state, view.dispatch)
			},
			{
				label: "Секцию",
				disabled: !addNodeByPos(range!.node, nodeTypes.section, startPos)(view.state),
				command: () => {
					addNodeByPos(range!.node, nodeTypes.section, startPos)(view.state, view.dispatch);
				}
			}
		]
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
		label: "Вставить заголовок",
		icon: "pi pi-plus-circle",
		disabled: !addNodeByPos(view.state.doc, nodeTypes.title, startPos)(view.state),
		command: () => addNodeByPos(view.state.doc, nodeTypes.title, startPos)(view.state, view.dispatch)
	},
	{
		label: "Вставить изображение",
		icon: "pi pi-plus-circle",
		disabled: !addNodeByPos(view.state.doc, nodeTypes.image, startPos)(view.state),
		command: () =>
			openImageDialog().then(file => {
				const imgid = imageStore.addAsDataURL(file.name, file.content);
				if (imgid) {
					const image = nodeTypes.image.create({ imgid });
					addNodeByPos(view.state.doc, nodeTypes.image, startPos, image)(view.state, view.dispatch);
				};
			}).catch((error) => openFileError(error))
	},
	{
		label: "Вставить эпиграф",
		icon: "pi pi-plus-circle",
		disabled: !addNodeByPos(view.state.doc, nodeTypes.epigraph, startPos)(view.state),
		command: () => addNodeByPos(view.state.doc, nodeTypes.epigraph, startPos)(view.state, view.dispatch)
	},
	{
		label: "Вставить секцию",
		icon: "pi pi-plus-circle",
		disabled: !addNodeByPos(view.state.doc, nodeTypes.section, startPos)(view.state),
		command: () => {
			addNodeByPos(view.state.doc, nodeTypes.section, startPos)(view.state, view.dispatch);
		}
	}
];

function show(event: Event, node: TreeNode) {
	const target = editorState.views[node.data || node.key];
	if (target) {
		view = target;
		nodeTypes = view.state.schema.nodes;
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