<template>
    <Tree :value="editorState.menu" selectionMode="single" @node-select="onNodeSelect" class="t-sidebar-container" :pt="{
        nodeContent: ({ context }) => ({
            oncontextmenu: (event: Event) => onContextRightClick(event, context.node)
        }),
        wrapper: { style: 'overflow-x: hidden' },
        nodeIcon: { style: 'flex-shrink: 0' },
        root: { style: 'padding: 0.75rem' }
    }" />

    <TreeContextMenu ref="contextMenu" />
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue';

import { Tree } from 'primevue';
import { TreeNode } from 'primevue/treenode';

import TreeContextMenu from '@/components/TreeContextMenu.vue';
import editorState from '@/modules/editorState';

const contentMenu = useTemplateRef<InstanceType<typeof TreeContextMenu>>('contextMenu');
function onContextRightClick(event: Event, node: TreeNode) {
    contentMenu.value?.show(event, node);
};

const emit = defineEmits(["switch"]);
emit("switch", "description");

function onNodeSelect(node: TreeNode) {
    if (node.key === "images") {
        emit("switch", "images");
    } else if (node.key === "description" || node.data === "description") {
        emit("switch", "description");
    } else {
        emit("switch", "content");
    };

    if (node.data) {
        editorState.setBody(node.data);
        queueMicrotask(() => {
            const element = document.querySelector(`[uid="${node.key}"]`);
            if (element) {
                element.scrollIntoView();
            };
        });
    };
};
</script>

<style>
.t-sidebar-container {
    flex: 1 1 auto;
    overflow-y: auto;
}
</style>