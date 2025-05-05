<template>
    <div ref="content" class="t-content-container">
        <Splitter layout="vertical">
            <SplitterPanel :size="75" :minSize="10" ref="body" style="overflow-y: auto;">
                <Editor editor-id="body" />
            </SplitterPanel>
            <SplitterPanel :size="25" :minSize="10" ref="notes" style="overflow-y: auto;">
                <Editor editor-id="notes" />
            </SplitterPanel>
        </Splitter>
    </div>
</template>

<script setup lang="ts">
import { onUpdated, useTemplateRef, ComponentPublicInstance } from "vue";

import { Splitter, SplitterPanel } from "primevue";

import Editor from "./Editor.vue";

import fileBroker, { documentBlocks } from "../fileBroker";
import editorState from "../editorState";

let toTop = false;
const content = useTemplateRef('content');
const body = useTemplateRef<ComponentPublicInstance>('body');
const notes = useTemplateRef<ComponentPublicInstance>('notes');
onUpdated(() => {
    if (toTop && content.value && !content.value.style.display) {
        body.value!.$el.scrollTop = 0;
        notes.value!.$el.scrollTop = 0;
        toTop = false;
    }
});

editorState.menu.push({
    key: 'content',
    label: 'Содержание',
    icon: 'pi pi-fw pi-book',
    isRoot: true,
    children: [
        {
            key: 'body',
            label: 'Произведение',
            icon: 'pi pi-fw pi-file-word',
            isRoot: true,
            children: editorState.getTOC("body")
        },
        {
            key: 'notes',
            label: 'Примечания',
            icon: 'pi pi-fw pi-asterisk',
            isRoot: true,
            children: editorState.getTOC("notes")
        }]
});

fileBroker.addDescriber(getParts);

function getParts(xmlDoc: Document, method: string) {
    toTop = method === "parse";

    const [body, notes] = xmlDoc.getElementsByTagName("body");

    const parts: documentBlocks = {
        "body": body,
        "notes": notes
    };

    return parts;
};

defineExpose({ getParts });
</script>

<style>
.t-content-container {
    display: flex;
    flex-grow: 1;
}
</style>