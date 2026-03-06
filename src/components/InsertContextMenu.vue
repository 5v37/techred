<template>
	<Menu ref="insertMenu" :model="insertMenuItems" :popup="true" @hide="onHide" />
</template>

<script setup lang="ts">
import { ref, nextTick, useTemplateRef } from "vue";

import { Menu } from "primevue";
import type { MenuItem } from "primevue/menuitem";
import type { EditorView } from "prosemirror-view";
import type { Node } from "prosemirror-model";

import { generateInsertMenuItems } from "@/modules/menuFactory";
import editorState from "@/modules/editorState";
import ui from "@/modules/ui";

const insertMenu = useTemplateRef<InstanceType<typeof Menu>>("insertMenu");
const insertMenuItems = ref<Array<MenuItem>>();

let isOpen = false;
let resolvePromise: (() => void) | null = null;

ui.showInsertBlockMenu = show;

function show(event: Event, view: EditorView, node: Node, pos: number): Promise<void> {
	if (isOpen) {
		insertMenu.value!.hide();
		return nextTick().then(() => show(event, view, node, pos));
	};

	isOpen = true;
	insertMenuItems.value = [{
		label: "Вставить",
		items: generateInsertMenuItems(view, node, pos)
	}];

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