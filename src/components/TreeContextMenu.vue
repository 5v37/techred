<template>
    <ContextMenu ref="contextMenu" :model="contextMenuItems" />

    <Dialog v-model:visible="nameDialog" modal header="Укажите новое имя раздела" :closable="false" class="t-ui-dialog">
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
let nodeTypes: typeof view.state.schema.nodes;
let range: SectionRange | undefined;
let startPos = 0;

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
        label: 'Вставить',
        icon: 'pi pi-plus-circle',
        disabled: range === undefined,
        items: [
            {
                label: 'Заголовок',
                disabled: !addNode(range!.node, nodeTypes.title, startPos)(view.state),
                command: () => addNode(range!.node, nodeTypes.title, startPos)(view.state, view.dispatch)
            },
            {
                label: 'Изображение',
                disabled: !addNode(range!.node, nodeTypes.image, startPos)(view.state),
                command: () =>
                    openImageDialog().then(file => {
                        editorState.images.value.addAsDataURL(file.name, file.content);
                        const image = nodeTypes.image.create({ href: "#" + file.name });
                        addNode(range!.node, nodeTypes.image, startPos, image)(view.state, view.dispatch);
                    }).catch((error) => {
                        toast.add({ severity: 'error', summary: 'Ошибка открытия файла', detail: error });
                    })
            },
            {
                label: 'Эпиграф',
                disabled: !addNode(range!.node, nodeTypes.epigraph, startPos)(view.state),
                command: () => addNode(range!.node, nodeTypes.epigraph, startPos)(view.state, view.dispatch)
            },
            {
                label: 'Аннотацию',
                disabled: !addNode(range!.node, nodeTypes.annotation, startPos)(view.state),
                command: () => addNode(range!.node, nodeTypes.annotation, startPos)(view.state, view.dispatch)
            },
            {
                label: 'Секцию',
                disabled: !addNode(range!.node, nodeTypes.section, startPos)(view.state),
                command: () => {
                    const section = nodeTypes.section.create({ id: self.crypto.randomUUID() }, nodeTypes.p.create());
                    addNode(range!.node, nodeTypes.section, startPos, section)(view.state, view.dispatch);
                }
            },
        ]
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
        disabled: !addNode(view.state.doc, nodeTypes.title, startPos)(view.state),
        command: () => addNode(view.state.doc, nodeTypes.title, startPos)(view.state, view.dispatch)
    },
    {
        label: 'Вставить изображение',
        icon: 'pi pi-plus-circle',
        disabled: !addNode(view.state.doc, nodeTypes.image, startPos)(view.state),
        command: () =>
            openImageDialog().then(file => {
                editorState.images.value.addAsDataURL(file.name, file.content);
                const image = nodeTypes.image.create({ href: "#" + file.name });
                addNode(view.state.doc, nodeTypes.image, startPos, image)(view.state, view.dispatch);
            }).catch((error) => {
                toast.add({ severity: 'error', summary: 'Ошибка открытия файла', detail: error });
            })
    },
    {
        label: 'Вставить эпиграф',
        icon: 'pi pi-plus-circle',
        disabled: !addNode(view.state.doc, nodeTypes.epigraph, startPos)(view.state),
        command: () => addNode(view.state.doc, nodeTypes.epigraph, startPos)(view.state, view.dispatch)
    },
    {
        label: 'Вставить секцию',
        icon: 'pi pi-plus-circle',
        disabled: !addNode(view.state.doc, nodeTypes.section, startPos)(view.state),
        command: () => {
            const section = nodeTypes.section.create({ id: self.crypto.randomUUID() }, nodeTypes.p.create());
            addNode(view.state.doc, nodeTypes.section, startPos, section)(view.state, view.dispatch);
        }
    },
];

function show(event: Event, node: TreeNode) {
    const target = editorState.getView(node.data || node.key);
    if (target) {
        view = target;
        nodeTypes = view.state.schema.nodes;
        if (node.data) {
            range = sectionRangeByID(node.key, view.state);
            startPos = range ? range.from + 1 : 0;
            contextMenuItems.value = sectionItems();
        } else {
            curBody = editorState.bodies[node.key];
            bodyName.value = curBody.name;
            needUpdateLabel = curBody.toc.label === bodyName.value || bodyName.value === "";
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