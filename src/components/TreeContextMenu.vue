<template>
    <ContextMenu ref="contextMenu" :model="contextMenuItems" />
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

import { ContextMenu } from 'primevue';
import { MenuItem } from 'primevue/menuitem';
import { TreeNode } from 'primevue/treenode';

import { EditorView } from 'prosemirror-view';

import { SectionRange, sectionRangeByID, excludeSection, includeSection, joinSection, moveUpSection, moveDownSection, deleteSection } from '../commands';
import editorState from '../editorState';

let view: EditorView;
let range: SectionRange | undefined;

const contextMenu = useTemplateRef('contextMenu');
const contextMenuItems = ref<MenuItem[]>([
    {
        label: 'Исключить',
        icon: 'pi pi-angle-double-left',
        disabled: () => !excludeSection(range)(view.state),
        command: () => excludeSection(range)(view.state, view.dispatch)
    },
    {
        label: 'Включить',
        icon: 'pi pi-angle-double-right',
        disabled: () => !includeSection(range)(view.state),
        command: () => includeSection(range)(view.state, view.dispatch)
    },
    {
        label: 'Объединить',
        icon: 'pi pi-chevron-circle-up',
        disabled: () => !joinSection(range)(view.state),
        command: () => joinSection(range)(view.state, view.dispatch)

    },
    {
        label: 'Сместить вверх',
        icon: 'pi pi-arrow-up',
        disabled: () => !moveUpSection(range)(view.state),
        command: () => moveUpSection(range)(view.state, view.dispatch)
    },
    {
        label: 'Сместить вниз',
        icon: 'pi pi-arrow-down',
        disabled: () => !moveDownSection(range)(view.state),
        command: () => moveDownSection(range)(view.state, view.dispatch)
    },
    {
        separator: true
    },
    {
        label: 'Удалить',
        icon: 'pi pi-trash',
        disabled: () => !deleteSection(range)(view.state),
        command: () => deleteSection(range)(view.state, view.dispatch)
    }
]);

function show(event: Event, node: TreeNode) {
    const target = editorState.getView(node.key.split("-")[0]);
    if (target) {
        view = target;
        range = sectionRangeByID(node.data, view.state);
        contextMenu.value!.show(event);
    } else {
        event.stopPropagation();
        event.preventDefault();
    };
};

defineExpose({ show });
</script>

<style></style>