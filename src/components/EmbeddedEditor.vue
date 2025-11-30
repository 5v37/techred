<template>
    <div class="t-embedded_editor t-link-tooltip-root">
        <EditorToolbar :editor-id="props.editorId" />
        <Editor ref="editor" :editor-id="props.editorId" annotation />
    </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from "vue";

import Editor from "./Editor.vue";
import EditorToolbar from "./EditorToolbar.vue";

const props = defineProps<{ editorId: string }>();
const editor = useTemplateRef<InstanceType<typeof Editor>>("editor");

function hasContent() {
    return editor.value ? editor.value.hasContent() : false;
}

defineExpose({ hasContent });
</script>

<style>
.t-embedded_editor {
    font-family: inherit;
    font-feature-settings: inherit;
    font-size: 1rem;
    min-height: 6rem;
    color: var(--p-inputtext-color);
    background: var(--p-inputtext-background);
    border: 1px solid var(--p-inputtext-border-color);
    transition: background var(--p-inputtext-transition-duration), color var(--p-inputtext-transition-duration), border-color var(--p-inputtext-transition-duration), outline-color var(--p-inputtext-transition-duration), box-shadow var(--p-inputtext-transition-duration);
    appearance: none;
    border-radius: var(--p-inputtext-border-radius);
    outline-color: transparent;
    box-shadow: var(--p-inputtext-shadow);
    flex: 1 1 auto;
}

.t-embedded_editor:hover {
    border-color: var(--p-inputtext-hover-border-color);
}

.t-embedded_editor:focus-within {
    border-color: var(--p-inputtext-focus-border-color);
    box-shadow: var(--p-inputtext-focus-ring-shadow);
    outline: var(--p-inputtext-focus-ring-width) var(--p-inputtext-focus-ring-style) var(--p-inputtext-focus-ring-color);
    outline-offset: var(--p-inputtext-focus-ring-offset);
}
</style>
