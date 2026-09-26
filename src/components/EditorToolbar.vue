<template>
	<div class="t-editor_toolbar">
		<ButtonGroup>
			<Button type="button" icon="pi pi-arrow-left" text severity="secondary" @mousedown="undo"
				:disabled="buttonState.undo" />
			<Button type="button" icon="pi pi-arrow-right" text severity="secondary" @mousedown="redo"
				:disabled="buttonState.redo" />
		</ButtonGroup>
		<span class="t-editor_toolbar-separator" />
		<ButtonGroup>
			<Button type="button" severity="secondary" @mousedown="mark('strong', $event)" :text="markState.strong">
				<strong>Ж</strong>
			</Button>
			<Button type="button" severity="secondary" @mousedown="mark('emphasis', $event)" :text="markState.emphasis">
				<em>К</em>
			</Button>
			<Button type="button" severity="secondary" @mousedown="mark('strikethrough', $event)"
				:text="markState.strikethrough">
				<s>аб</s>
			</Button>
			<Button type="button" severity="secondary" @mousedown="mark('sup', $event)" :text="markState.sup">
				<span>x<sup style="line-height: 0;">2</sup></span>
			</Button>
			<Button type="button" severity="secondary" @mousedown="mark('sub', $event)" :text="markState.sub">
				<span>x<sub style="line-height: 0;">2</sub></span>
			</Button>
			<Button type="button" severity="secondary" @mousedown="mark('code', $event)" :text="markState.code">
				М
			</Button>
			<Button type="button" icon="pi pi-link" severity="secondary" @mousedown="link" :text="markState.link" />
			<Button type="button" icon="pi pi-hashtag" text severity="secondary" @mousedown="id"
				:disabled="buttonState.id" />
		</ButtonGroup>
		<span class="t-editor_toolbar-separator" />
		<ButtonGroup>
			<Button type="button" label="Вставить" text severity="secondary" @mousedown="toggleInsertMenu"
				icon="pi pi-angle-down" iconPos="right" />
			<Menu ref="insertMenu" :model="insertMenuItems" :popup="true"
				:pt="{ root: { style: 'margin-top: -0.25rem' } }" />
			<Button type="button" label="Таблица" text severity="secondary" @mousedown="toggleTableMenu"
				icon="pi pi-angle-down" iconPos="right" v-show="isTable" />
			<TieredMenu ref="tableMenu" :model="tableMenuItems" :popup="true"
				:pt="{ root: { style: 'margin-top: -0.25rem' } }" />
		</ButtonGroup>
	</div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from "vue";

import { Button, ButtonGroup, Menu, TieredMenu } from "primevue";
import type { MenuItem } from "primevue/menuitem";
import type { Command } from "prosemirror-state";
import { undo as undoCommand, redo as redoCommand } from "prosemirror-history";
import { setBlockType, wrapIn } from "prosemirror-commands";

import editorState from "@/modules/editorState";
import imageRegistry from "@/modules/imageRegistry";
import { addInlineImage, addNodeAfterSelection, deleteTableSafety, setId, setLink, setMark, wrapPoem } from "@/modules/commands";
import { isSameMark, marksInPos } from "@/modules/transform";
import { addColumnAfter, addColumnBefore, addRowAfter, addRowBefore, deleteColumn, deleteRow, isInTable, mergeCells, setCellAttr, splitCell, toggleHeaderCell, toggleHeaderColumn, toggleHeaderRow } from "prosemirror-tables";
import { ViewManager } from "@/modules/viewManager";

const props = defineProps<{ viewManager: ViewManager }>();

const insertMenu = useTemplateRef<InstanceType<typeof Menu>>("insertMenu");
const insertMenuItems = ref<Array<MenuItem>>();
const tableMenu = useTemplateRef<InstanceType<typeof TieredMenu>>("tableMenu");
const tableMenuItems = ref<Array<MenuItem>>();

const idCommand = setId(false);
const linkCommand = setLink();

const insertCommand = (command: Command) => {
	editorState.restoreViewFocus();
	command(props.viewManager.state, props.viewManager.dispatch);
};
const createInsertMenuItems = () => [
	{
		label: nodeTypes.image.spec.label,
		disabled: !addNodeAfterSelection(nodeTypes.image)(props.viewManager.state),
		command: () => {
			imageRegistry.importFromDialog().then(imgid => {
				if (imgid) {
					const image = nodeTypes.image.create({ imgid });
					insertCommand(addNodeAfterSelection(nodeTypes.image, image));
				};
			});
		}
	},
	{
		label: "Изображение в текст",
		disabled: !addInlineImage()(props.viewManager.state),
		command: () => {
			imageRegistry.importFromDialog().then(imgid => {
				if (imgid) {
					const image = nodeTypes.inlineimage.create({ imgid });
					insertCommand(addInlineImage(image));
				};
			});
		}
	},
	{
		label: nodeTypes.subtitle.spec.label,
		disabled: !setBlockType(nodeTypes.subtitle)(props.viewManager.state),
		command: () => insertCommand(setBlockType(nodeTypes.subtitle))
	},
	{
		label: nodeTypes.poem.spec.label,
		disabled: !wrapPoem()(props.viewManager.state),
		command: () => insertCommand(wrapPoem())
	},
	{
		label: nodeTypes.table.spec.label,
		disabled: !addNodeAfterSelection(nodeTypes.table)(props.viewManager.state),
		command: () => {
			const tableTemplate = nodeTypes.table.create(null,
				[nodeTypes.tr.create(null, [nodeTypes.td.create(), nodeTypes.td.create()]),
				nodeTypes.tr.create(null, [nodeTypes.td.create(), nodeTypes.td.create()])]);
			insertCommand(addNodeAfterSelection(nodeTypes.table, tableTemplate));
		}
	},
	{
		label: nodeTypes.cite.spec.label,
		disabled: !wrapIn(nodeTypes.cite)(props.viewManager.state),
		command: () => insertCommand(wrapIn(nodeTypes.cite))
	}
];
const createTableMenuItems = () => [
	{
		label: "Вставить столбец слева",
		disabled: !addColumnBefore(props.viewManager.state),
		command: () => insertCommand(addColumnBefore)
	},
	{
		label: "Вставить столбец справа",
		disabled: !addColumnAfter(props.viewManager.state),
		command: () => insertCommand(addColumnAfter)
	},
	{
		label: "Удалить столбец",
		disabled: !deleteColumn(props.viewManager.state),
		command: () => insertCommand(deleteColumn)
	},
	{
		label: "Вставить строку сверху",
		disabled: !addRowBefore(props.viewManager.state),
		command: () => insertCommand(addRowBefore)
	},
	{
		label: "Вставить строку снизу",
		disabled: !addRowAfter(props.viewManager.state),
		command: () => insertCommand(addRowAfter)
	},
	{
		label: "Удалить строку",
		disabled: !deleteRow(props.viewManager.state),
		command: () => insertCommand(deleteRow)
	},
	{
		label: "Объединить ячейки",
		disabled: !mergeCells(props.viewManager.state),
		command: () => insertCommand(mergeCells)
	},
	{
		label: "Разделить ячейки",
		disabled: !splitCell(props.viewManager.state),
		command: () => insertCommand(splitCell)
	},
	{
		label: "Включить заголовочный столбец",
		disabled: !toggleHeaderColumn(props.viewManager.state),
		command: () => insertCommand(toggleHeaderColumn)
	},
	{
		label: "Включить заголовочную строку",
		disabled: !toggleHeaderRow(props.viewManager.state),
		command: () => insertCommand(toggleHeaderRow)
	},
	{
		label: "Включить заголовочную ячейку",
		disabled: !toggleHeaderCell(props.viewManager.state),
		command: () => insertCommand(toggleHeaderCell)
	},
	{
		label: "Выровнять",
		items: [
			{
				label: "Выровнять по левому краю",
				disabled: !setCellAttr("align", "left")(props.viewManager.state),
				command: () => insertCommand(setCellAttr("align", "left"))
			},
			{
				label: "Выровнять по центру",
				disabled: !setCellAttr("align", "center")(props.viewManager.state),
				command: () => insertCommand(setCellAttr("align", "center"))
			},
			{
				label: "Выровнять по правому краю",
				disabled: !setCellAttr("align", "right")(props.viewManager.state),
				command: () => insertCommand(setCellAttr("align", "right"))
			},
			{
				label: "Выровнять по верхнему краю",
				disabled: !setCellAttr("valign", "top")(props.viewManager.state),
				command: () => insertCommand(setCellAttr("valign", "top"))
			},
			{
				label: "Выровнять по середине",
				disabled: !setCellAttr("valign", "middle")(props.viewManager.state),
				command: () => insertCommand(setCellAttr("valign", "middle"))
			},
			{
				label: "Выровнять по нижнему краю",
				disabled: !setCellAttr("valign", "bottom")(props.viewManager.state),
				command: () => insertCommand(setCellAttr("valign", "bottom"))
			}
		]
	},
	{
		label: "Удалить таблицу",
		disabled: !deleteTableSafety()(props.viewManager.state),
		command: () => insertCommand(deleteTableSafety())
	}
];

props.viewManager.registerToolbar(updateButtonState);
const nodeTypes = props.viewManager.state.schema.nodes;
const markTypes = props.viewManager.state.schema.marks;

const isTable = ref(false);
const buttonState = ref({
	undo: true,
	redo: true,
	id: true
});

const MARK_KEYS = ["strong", "emphasis", "strikethrough", "sup", "sub", "code", "link"] as const;
const markState = ref(
	Object.fromEntries(MARK_KEYS.map(k => [k, true])) as Record<typeof MARK_KEYS[number], boolean>
);

function updateButtonState() {
	const state = props.viewManager.state;
	const { $from, $to, empty } = state.selection;

	buttonState.value.undo = !undoCommand(state);
	buttonState.value.redo = !redoCommand(state);
	buttonState.value.id = !idCommand(state);
	isTable.value = isInTable(state);

	const marks = marksInPos($to);
	for (const mark of MARK_KEYS) {
		markState.value[mark] = true;
	};

	let key: typeof MARK_KEYS[number];
	for (const mark of marks) {
		key = (mark.type === markTypes.a || mark.type === markTypes.note) ? "link" : mark.type.name as typeof MARK_KEYS[number];
		if (empty || isSameMark($from, $to, mark)) {
			markState.value[key] = false;
		}
	};
}

function undo(event: MouseEvent) {
	if (event.button === 0) {
		event.preventDefault();

		undoCommand(props.viewManager.state, props.viewManager.dispatch);
	}
}

function redo(event: MouseEvent) {
	if (event.button === 0) {
		event.preventDefault();

		redoCommand(props.viewManager.state, props.viewManager.dispatch);
	}
}

function mark(key: typeof MARK_KEYS[number], event: MouseEvent) {
	if (event.button === 0) {
		event.preventDefault();

		const isActive = !markState.value[key];
		const markType = props.viewManager.state.schema.marks[key];
		setMark(markType, isActive)(props.viewManager.state, props.viewManager.dispatch);
	}
}

function link(event: MouseEvent) {
	if (event.button === 0) {
		event.preventDefault();

		linkCommand(props.viewManager.state, props.viewManager.dispatch);
	}
}

function id(event: MouseEvent) {
	if (event.button === 0) {
		event.preventDefault();

		idCommand(props.viewManager.state, props.viewManager.dispatch);
	}
}

function toggleInsertMenu(event: MouseEvent) {
	if (event.button === 0) {
		event.preventDefault();

		insertMenuItems.value = createInsertMenuItems();
		editorState.saveViewFocus();
		insertMenu.value!.toggle(event);
	}
}

function toggleTableMenu(event: MouseEvent) {
	if (event.button === 0) {
		event.preventDefault();

		tableMenuItems.value = createTableMenuItems();
		editorState.saveViewFocus();
		tableMenu.value!.toggle(event);
	}
}
</script>

<style>
.t-editor_toolbar {
	display: flex;
	background: var(--p-content-background);
	border-top-left-radius: inherit;
	border-top-right-radius: inherit;
	border-bottom: thin solid var(--p-toolbar-border-color);
}

.t-editor_toolbar-separator {
	margin-block: 0.5rem;
	border-right: thin solid var(--p-toolbar-border-color);
}
</style>