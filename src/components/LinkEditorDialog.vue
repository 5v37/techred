<template>
    <Dialog v-model:visible="visible" modal :closable="false" :close-on-escape="false" class="t-ui-dialog"
        header="Редактирование ссылки">
        <div class="t-ui-container">
            <div class="t-linkeditordialog-container">
                <label class="t-linkeditordialog-label">Тип</label>
                <SelectButton v-model="typeLink" :options="typeLinkOptions" :allow-empty="false" fluid
                    @change="href = ''" />
            </div>
            <div class="t-linkeditordialog-container">
                <label class="t-linkeditordialog-label">Значение</label>
                <InputText v-if="!noteLink" v-model.lazy="href" autofocus fluid />
                <Select v-if="noteLink" v-model="selectedId" :options="notes" filter autoFilterFocus showClear
                    :pt="{ label: { autofocus: true } }" fluid />
            </div>
        </div>
        <template #footer>
            <Button type="button" label="Отмена" severity="secondary" @click="closeDialog"></Button>
            <Button type="button" label="Сохранить" @click="saveLink"></Button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Dialog, SelectButton, InputText, Button, Select } from "primevue";

import { Mark } from "prosemirror-model";
import { EditorState, Transaction } from "prosemirror-state";

import editorState from "@/modules/editorState";
import { updateLink } from "@/modules/pm/commands";
import ui from "@/modules/ui";

const typeLinkOptions = ref(["Сноска", "Гиперссылка"]);
const typeLink = ref(typeLinkOptions.value[0]);
const visible = ref(false);
const href = ref("");
const selectedId = ref("");

let params: {
    state: EditorState,
    dispatch: (tr: Transaction) => void,
    mark?: Mark
};
let notes: Array<string>;

const noteLink = computed(() => {
    return typeLink.value === typeLinkOptions.value[0];
});

ui.openLinkEditorDialog = openDialog;

function keyListener(event: KeyboardEvent) {
    if (event.defaultPrevented) {
        return;
    };

    if (event.code === "Escape") {
        closeDialog();
    } else if (event.code === "Enter") {
        saveLink();
    } else {
        return;
    };
    event.preventDefault();
}

function openDialog(state: EditorState, dispatch: (tr: Transaction) => void, mark?: Mark) {
    params = { state, dispatch, mark };
    notes = Array.from(editorState.getIds(true));
    href.value = "";
    selectedId.value = "";

    if (mark && mark.type === state.schema.marks.a) {
        typeLink.value = typeLinkOptions.value[1];
        href.value = mark.attrs.href;
        selectedId.value = "";
    } else {
        typeLink.value = typeLinkOptions.value[0];
        href.value = "";
        selectedId.value = mark?.attrs.href ? mark.attrs.href.slice(1) : "";
    };

    editorState.saveViewFocus();
    visible.value = true;
    addEventListener("keydown", keyListener);
}

function closeDialog() {
    editorState.restoreViewFocus();
    visible.value = false;
    removeEventListener("keydown", keyListener);
}

function saveLink() {
    let attr, linkType;
    if (noteLink.value) {
        if (selectedId.value) {
            attr = { href: "#" + selectedId.value };
            linkType = params.state.schema.marks.note;
        };
    } else {
        if (href.value) {
            attr = { href: href.value };
            linkType = params.state.schema.marks.a;
        };
    };

    updateLink(linkType, params.mark?.type, attr)(params.state, params.dispatch);
    closeDialog();
}
</script>

<style>
.t-linkeditordialog-container {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 1rem;
}

.t-linkeditordialog-label {
    width: 5rem;
    flex-shrink: 0;
}
</style>