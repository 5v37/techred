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
                <Select v-if="noteLink" v-model="selectedId" :options="notes" filter showClear class="t-ui-grow" />
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
import { Dialog, SelectButton, InputText, Button, Select } from "primevue";

import editorState from "../editorState";

const typeLinkOptions = ref(['Примечание', 'Гиперссылка']);
const typeLink = ref(typeLinkOptions.value[0]);
const visible = ref(false);
const href = ref("");
const selectedId = ref("");

let notes: Array<string>;
let callback: (attrs: Attrs) => void;

const noteLink = computed(() => {
    return typeLink.value === typeLinkOptions.value[0];
})

function showEditLink(attrs: Attrs, command: (attrs: Attrs) => void) {
    href.value = "";
    selectedId.value = "";
    notes = Array.from(editorState.getIds(true));

    if (attrs.type === "note" || !attrs.href) {
        typeLink.value = typeLinkOptions.value[0];
        selectedId.value = attrs.href ? attrs.href.slice(1) : "";
    } else {
        typeLink.value = typeLinkOptions.value[1];
        href.value = attrs.href;
    };

    visible.value = true;
    callback = command;
};

function saveLink() {
    let attr = {}
    if (noteLink.value) {
        if (selectedId.value) {
            attr = { type: "note", href: "#" + selectedId.value };
        };
    } else {
        if (href.value) {
            attr = { type: "", href: href.value };
        };
    };

    visible.value = false;
    callback(attr);
};

defineExpose({
    showEditLink,
});
</script>

<style></style>