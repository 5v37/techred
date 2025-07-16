<template>
    <ContextMenu ref="contextMenu" :model="contextMenuItems" />

    <Dialog v-model:visible="nameDialog" modal header="Укажите новое имя раздела" :closable="false">
        <InputText v-model.lazy.trim=bodyName style="width: 100%;" />
        <template #footer>
            <Button type="button" label="Отмена" severity="secondary" @click="nameDialog = false"></Button>
            <Button type="button" label="Ок" @click="changeName"></Button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

import { ContextMenu, Dialog, Button, InputText, useToast } from 'primevue';
import { MenuItem } from 'primevue/menuitem';
import { TreeNode } from 'primevue/treenode';

import { EditorView } from 'prosemirror-view';

import { SectionRange, sectionRangeByID, excludeSection, includeSection, joinSection, moveUpSection, moveDownSection, deleteSection, addNode } from '../commands';
import { openImageDialog } from '../fileAccess';
import editorState from '../editorState';

let view: EditorView;
let range: SectionRange | undefined;

let curBody = editorState.bodies[0];
let needUpdateLabel = false;
const bodyName = ref("");
const nameDialog = ref(false);

function changeName() {
    curBody.name = bodyName.value;
    if (needUpdateLabel) {
        curBody.toc.label = bodyName.value || "<body>";
    }
    nameDialog.value = false;
}

const contextMenu = useTemplateRef("contextMenu");
const contextMenuItems = ref<MenuItem[]>([]);
const toast = useToast();

const sectionItems = () => [
    {
        label: 'Исключить',
        icon: 'pi pi-angle-double-left',
        disabled: !excludeSection(range)(view.state),
        command: () => excludeSection(range)(view.state, view.dispatch)
    },
    {
        label: 'Включить',
        icon: 'pi pi-angle-double-right',
        disabled: !includeSection(range)(view.state),
        command: () => includeSection(range)(view.state, view.dispatch)
    },
    {
        label: 'Объединить',
        icon: 'pi pi-chevron-circle-up',
        disabled: !joinSection(range)(view.state),
        command: () => joinSection(range)(view.state, view.dispatch)
    },
    {
        label: 'Сместить вверх',
        icon: 'pi pi-arrow-up',
        disabled: !moveUpSection(range)(view.state),
        command: () => moveUpSection(range)(view.state, view.dispatch)
    },
    {
        label: 'Сместить вниз',
        icon: 'pi pi-arrow-down',
        disabled: !moveDownSection(range)(view.state),
        command: () => moveDownSection(range)(view.state, view.dispatch)
    },
    {
        separator: true
    },
    {
        label: 'Удалить',
        icon: 'pi pi-trash',
        disabled: !deleteSection(range)(view.state),
        command: () => deleteSection(range)(view.state, view.dispatch)
    }
];

const bodyItems = () => [
    {
        label: 'Указать имя',
        icon: 'pi pi-tag',
        command: () => nameDialog.value = true
    },
    {
        label: 'Вставить заголовок',
        icon: 'pi pi-plus-circle',
        disabled: !addNode(view.state.doc, view.state.schema.nodes.title, 0)(view.state),
        command: () => addNode(view.state.doc, view.state.schema.nodes.title, 0)(view.state, view.dispatch)
    },
    {
        label: 'Вставить изображение',
        icon: 'pi pi-plus-circle',
        disabled: !addNode(view.state.doc, view.state.schema.nodes.image, 0)(view.state),
        command: () =>
            openImageDialog().then(file => {
                editorState.images.value.addAsDataURL(file.name, file.content);
                const image = view.state.schema.nodes.image.create({ href: "#" + file.name }, view.state.schema.nodes.p.create());
                addNode(view.state.doc, view.state.schema.nodes.image, 0, image)(view.state, view.dispatch);
            }).catch((error) => {
                toast.add({ severity: 'error', summary: 'Ошибка открытия файла', detail: error });
            })
    },
    {
        label: 'Вставить эпиграф',
        icon: 'pi pi-plus-circle',
        disabled: !addNode(view.state.doc, view.state.schema.nodes.epigraph, 0)(view.state),
        command: () => addNode(view.state.doc, view.state.schema.nodes.epigraph, 0)(view.state, view.dispatch)
    }
];

function show(event: Event, node: TreeNode) {
    const target = editorState.getView(node.key.split("-")[0]);
    if (target) {
        view = target;
        if (node.data) {
            range = sectionRangeByID(node.data, view.state);
            contextMenuItems.value = sectionItems();
        } else {
            curBody = editorState.bodies[node.key];
            bodyName.value = curBody.name;
            needUpdateLabel = curBody.toc.label === bodyName.value || bodyName.value === "";

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

<style></style>