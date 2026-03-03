<template>
	<Menu ref="insertMenu" :model="insertMenuItems" :popup="true" @hide="onHide" />
</template>

<script setup lang="ts">
import { ref, nextTick, useTemplateRef } from "vue";

import { Menu } from "primevue";
import type { MenuItem } from "primevue/menuitem";
import type { Command } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { ContentMatch, Node, NodeType } from "prosemirror-model";

import editorState from "@/modules/editorState";
import imageStore from "@/modules/imageStore";
import { addNode } from "@/modules/commands";
import { openImageDialog } from "@/modules/fileAccess";
import { openFileError } from "@/modules/notifications";
import ui from "@/modules/ui";

const insertMenu = useTemplateRef<InstanceType<typeof Menu>>("insertMenu");
const insertMenuItems = ref<Array<MenuItem>>();

let editorView: EditorView;
let isOpen = false;
let resolvePromise: (() => void) | null = null;

ui.showInsertBlockMenu = show;

const insertCommand = (command: Command) => {
	editorState.restoreViewFocus();
	command(editorView.state, editorView.dispatch);
};

const createInsertMenuItems = (node: Node, pos: number) => {
	const allowed = getAllowedChildren(node);
	const menu: MenuItem[] = [];

	for (const nodeType of allowed) {
		const action = getInsertAction(node, nodeType, pos);
		menu.push({
			label: nodeType.spec.label || nodeType.name,
			disabled: !action(editorView.state),
			command: () => insertCommand(action)
		});
	};

	return [{
		label: "Вставить",
		items: menu.sort((item1, item2) => (item1.label as string).localeCompare(item2.label as string))
	}];
};

function getAllowedChildren(node: Node) {
	const visited = new Set<ContentMatch>();
	const allowedTypes = new Set<NodeType>();
	const queue = [node.type.contentMatch];

	while (queue.length > 0) {
		const match = queue.pop()!;
		if (visited.has(match)) continue;
		visited.add(match);

		for (let i = 0; i < match.edgeCount; i++) {
			const { type, next } = match.edge(i);
			allowedTypes.add(type);
			queue.push(next);
		}
	}

	return allowedTypes;
}

function getInsertAction(node: Node, nodeType: NodeType, pos: number): Command {
	const nodeTypes = editorView.state.schema.nodes;
	let defaultNode = undefined;
	if (nodeType === nodeTypes.image) {
		return (state, dispatch) => {
			if (dispatch) {
				openImageDialog().then(file => {
					const nodeTypes = state.schema.nodes;
					const imgid = imageStore.addAsDataURL(file.name, file.content);
					if (imgid) {
						const image = nodeTypes.image.create({ imgid });
						return addNode(node, nodeType, pos, image)(state, dispatch);
					};
				}).catch((error) => openFileError(error));
			} else {
				return addNode(node, nodeType, pos)(state);
			};

			return true;
		};
	} else if (nodeType === nodeTypes.poem) {
		defaultNode = nodeType.create(null, nodeTypes.stanza.create(null, nodeTypes.v.create()));
	} else if (nodeType === nodeTypes.cite || nodeType === nodeTypes.section || nodeType === nodeTypes.epigraph) {
		defaultNode = nodeType.create(null, nodeTypes.p.create());
	};

	return addNode(node, nodeType, pos, defaultNode);
}

function show(event: Event, view: EditorView, node: Node, pos: number): Promise<void> {
	if (isOpen) {
		insertMenu.value!.hide();
		return nextTick().then(() => show(event, view, node, pos));
	};

	isOpen = true;
	editorView = view;

	insertMenuItems.value = createInsertMenuItems(node, pos);
	editorState.saveViewFocus();
	insertMenu.value!.show(event);

	return new Promise<void>((resolve) => {
		resolvePromise = resolve;
	});
}

function onHide() {
	isOpen = false;

	if (resolvePromise) {
		resolvePromise();
		resolvePromise = null;
	};
}
</script>