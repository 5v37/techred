<template>
    <Dialog v-model:visible="visible" modal header="Редактирование ссылки" :closable="false" style="width: 25rem;">
        <div class="t-ui-container">
            <div class="t-ui-chipcontainer">
                <label style="width: 5rem;">Тип</label>
                <SelectButton v-model="typeLink" :options="typeLinkOptions" @change="href = ''" class="t-ui-grow" />
            </div>
            <div class="t-ui-chipcontainer">
                <label style="width: 5rem;">Значение</label>
                <InputText v-if="!noteLink" v-model.lazy="href" class="t-ui-grow" />
                <TreeSelect v-if="noteLink" v-model="node" :options="notes" @node-select=onNodeSelect
                    class="t-ui-grow" />
            </div>
        </div>
        <template #footer>
            <Button type="button" label="Отмена" severity="secondary" @click="visible = false"></Button>
            <Button type="button" label="Сохранить" @click="saveLink"></Button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { Attrs } from "prosemirror-model";

import { Dialog, SelectButton, InputText, Button, TreeSelect } from "primevue";
import { TreeNode } from "primevue/treenode";
import editorState from "../editorState";

const typeLinkOptions = ref(['Примечание', 'Гиперссылка']);
const typeLink = ref(typeLinkOptions.value[0]);
const visible = ref(false);
const href = ref("");
const node = ref();
const notes = editorState.getTOC("notes");

let callback: (attrs: Attrs) => void;
let selectedNode: TreeNode | undefined;

const noteLink = computed(() => {
    return typeLink.value === typeLinkOptions.value[0];
})

function onNodeSelect(node: TreeNode) {
    selectedNode = node;
}

function showEditLink(attrs: Attrs, command: (attrs: Attrs) => void) {
    visible.value = true;

    href.value = "";
    node.value = undefined;

    if (attrs.type === "" && !noteLink.value) {
        typeLink.value = typeLinkOptions.value[1];
        href.value = attrs.href;
    } else {
        typeLink.value = typeLinkOptions.value[0];
        if (attrs.href) {
            const selectedNode = notes.find((node) => node.id === attrs.href);
            if (selectedNode) {
                node.value = { [selectedNode.key]: true };
            };
        }

    };

    callback = command;
};

function saveLink() {
    visible.value = false;

    if (noteLink.value) {
        let hrefNote = "";
        if (selectedNode) {
            if (selectedNode.id) {
                hrefNote = selectedNode.id
            } else {
                // надо создать
            };
        };
        callback({ type: "note", href: hrefNote });
    } else {
        callback({ type: "", href: href.value });
    };
};

defineExpose({
    showEditLink,
});
</script>

<style></style>