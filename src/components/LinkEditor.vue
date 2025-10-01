<template>
    <Dialog v-model:visible="visible" modal :closable="false" :close-on-escape="false" lass="t-ui-dialog"
        header="Редактирование ссылки">
        <div class="t-ui-container">
            <div class="t-ui-chipcontainer">
                <label style="width: 5rem;">Тип</label>
                <SelectButton v-model="typeLink" :options="typeLinkOptions" @change="href = ''" class="t-ui-grow" />
            </div>
            <div class="t-ui-chipcontainer">
                <label style="width: 5rem;">Значение</label>
                <InputText v-if="!noteLink" v-model.lazy="href" class="t-ui-grow" />
                <Select v-if="noteLink" v-model="selectedId" :options="notes" filter showClear class="t-ui-grow" />
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

import { Attrs, Mark } from "prosemirror-model";
import { toggleMark } from "prosemirror-commands";
import { EditorState, TextSelection, Transaction } from "prosemirror-state";

import editorState from "../editorState";
import { bodySchema } from "../fb2Model";
import { markPosition, updateMark } from "../commands";

const typeLinkOptions = ref(['Примечание', 'Гиперссылка']);
const typeLink = ref(typeLinkOptions.value[0]);
const visible = ref(false);
const href = ref("");
const selectedId = ref("");

let params: {
    state: EditorState,
    dispatch: (tr: Transaction) => void,
    mark: Mark
};
let notes: Array<string>;

const noteLink = computed(() => {
    return typeLink.value === typeLinkOptions.value[0];
})

function keyListener(event: KeyboardEvent) {
    if (event.code === "Escape") {
        closeDialog();
    } else if (event.code === "Enter") {
        saveLink();
    } else {
        return;
    };
    event.preventDefault();
}

function showEditLink(state: EditorState, dispatch: (tr: Transaction) => void, mark: Mark) {
    params = { state, dispatch, mark };
    notes = Array.from(editorState.getIds(true));

    if (mark.type === bodySchema.marks.note) {
        typeLink.value = typeLinkOptions.value[0];
        href.value = "";
        selectedId.value = mark.attrs.href ? mark.attrs.href.slice(1) : "";
    } else {
        typeLink.value = typeLinkOptions.value[1];
        href.value = mark.attrs.href;
        selectedId.value = "";
    };

    editorState.saveViewFocus();
    visible.value = true;
    addEventListener("keydown", keyListener);
};

function closeDialog() {
    editorState.restoreViewFocus();
    visible.value = false;
    removeEventListener("keydown", keyListener);
}

function saveLink() {
    let attr: Attrs = {}, linkType = bodySchema.marks.a;
    if (noteLink.value) {
        if (selectedId.value) {
            attr = { href: "#" + selectedId.value };
            linkType = bodySchema.marks.note;
        };
    } else {
        if (href.value) {
            attr = { href: href.value };
            linkType = bodySchema.marks.a;
        };
    };

    if (!updateMark(linkType, attr)(params.state, params.dispatch)) {
        const position = markPosition(params.state, params.state.selection.head, linkType === bodySchema.marks.note ? bodySchema.marks.a : bodySchema.marks.note);
        if (position) { // если изменили тип ссылки
            params.state.selection = TextSelection.create(params.state.doc, position.from, position.to);
        };        
        toggleMark(linkType, attr)(params.state, params.dispatch)
    };

    closeDialog();
};

defineExpose({
    showEditLink,
});
</script>

<style></style>