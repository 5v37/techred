import type { ContentMatch, Node, NodeType, Schema } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import type { Command } from "prosemirror-state";
import type { MenuItem } from "primevue/menuitem";

import { addNodeByPos } from "@/modules/commands";
import { openImageDialog } from "@/modules/fileAccess";
import { openFileError } from "@/modules/notifications";
import imageStore from "@/modules/imageStore";
import editorState from "@/modules/editorState";

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
	};

	return allowedTypes;
}

function getInsertAction(schema: Schema, node: Node, nodeType: NodeType, pos: number): Command {
	const nodeTypes = schema.nodes;
	if (nodeType === nodeTypes.image || nodeType === nodeTypes.inlineimage) {
		return addImageByPos(node, nodeType, pos);
	};

	return addNodeByPos(node, nodeType, pos);
}

function addImageByPos(node: Node, nodeType: NodeType, pos: number): Command {
	return (state, dispatch) => {
		if (!dispatch) {
			return addNodeByPos(node, nodeType, pos)(state, dispatch);
		};

		openImageDialog().then(file => {
			const imgid = imageStore.addAsDataURL(file.name, file.content);
			if (imgid && dispatch) {
				const imageNode = nodeType.create({ imgid });
				addNodeByPos(node, nodeType, pos, imageNode)(state, dispatch);
			}
		}).catch((error) => openFileError(error));

		return true;
	};
}

function wrapCommand(view: EditorView, command: Command) {
	editorState.restoreViewFocus();
	command(view.state, view.dispatch);
}

export function generateInsertMenuItems(view: EditorView, node: Node, pos: number) {
	const allowed = getAllowedChildren(node);
	const menu: MenuItem[] = [];

	for (const nodeType of allowed) {
		const action = getInsertAction(view.state.schema, node, nodeType, pos);
		menu.push({
			label: nodeType.spec.label || nodeType.name,
			disabled: !action(view.state),
			command: () => wrapCommand(view, action)
		});
	};

	return menu.sort((item1, item2) => (item1.label as string).localeCompare(item2.label as string));
};