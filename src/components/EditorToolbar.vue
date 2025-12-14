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
			<Button type="button" label="Превратить" text severity="secondary" @mousedown="toggleChangeMenu"
				icon="pi pi-angle-down" iconPos="right" />
			<Menu ref="changeMenu" :model="changeMenuItems" :popup="true"
				:pt="{ root: { style: 'margin-top: -0.25rem' } }" />
		</ButtonGroup>
	</div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from "vue";

import { Button, ButtonGroup, Menu, TieredMenu } from "primevue";
import type { MenuItem } from "primevue/menuitem";
import type { Command } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { redo as localRedo, undo as localUndo } from "prosemirror-history"
import { setBlockType, wrapIn } from "prosemirror-commands";

import editorState from "@/modules/editorState";
import { addInlineImage, addNodeAfterSelection, addTextautor, addTitle, changeToSection, deleteTableSafety, setId, setLink, setMark, wrapPoem } from "@/modules/commands";
import { openImageDialog } from "@/modules/fileAccess";
import { openFileError } from "@/modules/notifications";
import { isSameMark, marksInPos } from "@/modules/transform";
import { sharedRedo, sharedUndo } from "@/extensions/sharedHistory";
import { addColumnAfter, addColumnBefore, addRowAfter, addRowBefore, deleteColumn, deleteRow, isInTable, mergeCells, setCellAttr, splitCell, toggleHeaderCell, toggleHeaderColumn, toggleHeaderRow } from "prosemirror-tables";
import { NodeType } from "prosemirror-model";

const props = defineProps<{ editorId: string }>();

const insertMenu = useTemplateRef<InstanceType<typeof Menu>>("insertMenu")
const insertMenuItems = ref<Array<MenuItem>>();
const changeMenu = useTemplateRef<InstanceType<typeof Menu>>("changeMenu")
const changeMenuItems = ref<Array<MenuItem>>();
const tableMenu = useTemplateRef<InstanceType<typeof TieredMenu>>("tableMenu")
const tableMenuItems = ref<Array<MenuItem>>();

const sh = props.editorId === "mainEditor";
const undoCommand = sh ? sharedUndo : localUndo;
const redoCommand = sh ? sharedRedo : localRedo;
const idCommand = setId(false);
const linkCommand = setLink();

const insertCommand = (command: Command) => {
	editorState.restoreViewFocus();
	command(editorView.state, editorView.dispatch);
};
const createInsertMenuItems = () => [
	{
		label: "Заголовок",
		disabled: !addTitle()(editorView.state),
		command: () => insertCommand(addTitle())
	},
	{
		label: 'Автор',
		disabled: !addTextautor()(editorView.state),
		command: () => insertCommand(addTextautor())
	},
	{
		label: 'Абзац',
		disabled: !addNodeAfterSelection(nodes.p)(editorView.state),
		command: () => insertCommand(addNodeAfterSelection(nodes.p))
	},
	{
		label: 'Изображение',
		disabled: !addNodeAfterSelection(nodes.image)(editorView.state),
		command: () => {
			openImageDialog().then(file => {
				const id = editorState.images.value.addAsDataURL(file.name, file.content);
				if (id) {
					const image = nodes.image.create({ href: "#" + id });
					insertCommand(addNodeAfterSelection(nodes.image, image));
				};
			}).catch((error) => openFileError(error));
		}
	},
	{
		label: 'Изображение в текст',
		disabled: !addInlineImage()(editorView.state),
		command: () => {
			openImageDialog().then(file => {
				const id = editorState.images.value.addAsDataURL(file.name, file.content);
				if (id) {
					const image = nodes.inlineimage.create({ href: "#" + id });
					insertCommand(addInlineImage(image));
				};
			}).catch((error) => openFileError(error));
		}
	},
	{
		label: 'Таблица',
		disabled: !addNodeAfterSelection(nodes.table)(editorView.state),
		command: () => {
			const tableTemplate = nodes.table.create(null,
				[nodes.tr.create(null, [nodes.td.create(), nodes.td.create()]),
				nodes.tr.create(null, [nodes.td.create(), nodes.td.create()])]);
			insertCommand(addNodeAfterSelection(nodes.table, tableTemplate));
		}
	}
];
const createChangeMenuItems = () => [
	{
		label: "Подзаголовок",
		disabled: !setBlockType(nodes.subtitle)(editorView.state),
		command: () => insertCommand(setBlockType(nodes.subtitle))
	},
	{
		label: 'Цитата',
		disabled: !wrapIn(nodes.cite)(editorView.state),
		command: () => insertCommand(wrapIn(nodes.cite))
	},
	{
		label: 'Стих',
		disabled: !wrapPoem()(editorView.state),
		command: () => insertCommand(wrapPoem())
	},
	{
		label: 'Абзац',
		disabled: !setBlockType(nodes.p)(editorView.state),
		command: () => insertCommand(setBlockType(nodes.p))
	},
	{
		label: 'Секция',
		disabled: !changeToSection()(editorView.state),
		command: () => insertCommand(changeToSection())
	}
];
const createTableMenuItems = () => [
	{
		label: "Вставить столбец слева",
		disabled: !addColumnBefore(editorView.state),
		command: () => insertCommand(addColumnBefore)
	},
	{
		label: 'Вставить столбец справа',
		disabled: !addColumnAfter(editorView.state),
		command: () => insertCommand(addColumnAfter)
	},
	{
		label: 'Удалить столбец',
		disabled: !deleteColumn(editorView.state),
		command: () => insertCommand(deleteColumn)
	},
	{
		label: 'Вставить строку сверху',
		disabled: !addRowBefore(editorView.state),
		command: () => insertCommand(addRowBefore)
	},
	{
		label: 'Вставить строку снизу',
		disabled: !addRowAfter(editorView.state),
		command: () => insertCommand(addRowAfter)
	},
	{
		label: 'Удалить строку',
		disabled: !deleteRow(editorView.state),
		command: () => insertCommand(deleteRow)
	},
	{
		label: 'Объединить ячейки',
		disabled: !mergeCells(editorView.state),
		command: () => insertCommand(mergeCells)
	},
	{
		label: 'Разделить ячейки',
		disabled: !splitCell(editorView.state),
		command: () => insertCommand(splitCell)
	},
	{
		label: 'Включить заголовочный столбец',
		disabled: !toggleHeaderColumn(editorView.state),
		command: () => insertCommand(toggleHeaderColumn)
	},
	{
		label: 'Включить заголовочную строку',
		disabled: !toggleHeaderRow(editorView.state),
		command: () => insertCommand(toggleHeaderRow)
	},
	{
		label: 'Включить заголовочную ячейку',
		disabled: !toggleHeaderCell(editorView.state),
		command: () => insertCommand(toggleHeaderCell)
	},
	{
		label: 'Выровнять',
		items: [
			{
				label: 'Выровнять по левому краю',
				disabled: !setCellAttr('align', 'left')(editorView.state),
				command: () => insertCommand(setCellAttr('align', 'left'))
			},
			{
				label: 'Выровнять по центру',
				disabled: !setCellAttr('align', 'center')(editorView.state),
				command: () => insertCommand(setCellAttr('align', 'center'))
			},
			{
				label: 'Выровнять по правому краю',
				disabled: !setCellAttr('align', 'right')(editorView.state),
				command: () => insertCommand(setCellAttr('align', 'right'))
			},
			{
				label: 'Выровнять по верхнему краю',
				disabled: !setCellAttr('valign', 'top')(editorView.state),
				command: () => insertCommand(setCellAttr('valign', 'top'))
			},
			{
				label: 'Выровнять по середине',
				disabled: !setCellAttr('valign', 'middle')(editorView.state),
				command: () => insertCommand(setCellAttr('valign', 'middle'))
			},
			{
				label: 'Выровнять по нижнему краю',
				disabled: !setCellAttr('valign', 'bottom')(editorView.state),
				command: () => insertCommand(setCellAttr('valign', 'bottom'))
			},
		]
	},
	{
		label: 'Удалить таблицу',
		disabled: !deleteTableSafety()(editorView.state),
		command: () => insertCommand(deleteTableSafety())
	}
];

let editorView: EditorView;
let nodes: { [key: string]: NodeType };
editorState.toolbars[props.editorId] = updateButtonState;

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

function updateButtonState(view: EditorView) {
	editorView = view;
	nodes = view.state.schema.nodes;

	const state = view.state;
	const { $from, $to, empty } = state.selection;

	buttonState.value.undo = !undoCommand(state);
	buttonState.value.redo = !redoCommand(state);
	buttonState.value.id = !idCommand(state);
	isTable.value = isInTable(state);

	const marks = marksInPos($to);
	const markTypes = state.schema.marks;

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

		undoCommand(editorView.state, editorView.dispatch);
	}
}

function redo(event: MouseEvent) {
	if (event.button === 0) {
		event.preventDefault();

		redoCommand(editorView.state, editorView.dispatch);
	}
}

function mark(key: typeof MARK_KEYS[number], event: MouseEvent) {
	if (event.button === 0) {
		event.preventDefault();

		const isActive = !markState.value[key];
		const markType = editorView.state.schema.marks[key];
		setMark(markType, isActive)(editorView.state, editorView.dispatch);
	}
}

function link(event: MouseEvent) {
	if (event.button === 0) {
		event.preventDefault();

		linkCommand(editorView.state, editorView.dispatch);
	}
}

function id(event: MouseEvent) {
	if (event.button === 0) {
		event.preventDefault();

		idCommand(editorView.state, editorView.dispatch);
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

function toggleChangeMenu(event: MouseEvent) {
	if (event.button === 0) {
		event.preventDefault();

		changeMenuItems.value = createChangeMenuItems();
		editorState.saveViewFocus();
		changeMenu.value!.toggle(event);
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