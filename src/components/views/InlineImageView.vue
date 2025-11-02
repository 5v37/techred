<template>
  <img :src="src" :alt="alt" class="t-inlineimageview-content" :class="{ 'ProseMirror-selectednode': selected }" />    
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useNodeViewContext } from '@prosemirror-adapter/vue';

import editorState from '@/modules/editorState';

const { node, selected } = useNodeViewContext();
const alt = computed(() => {
  return node.value.attrs.alt || src.value ? node.value.attrs.alt : "<нет данных для отображения>"; 
});
const src = computed(() => {
  return node.value.attrs.href ? editorState.images.value.getDataByHref(node.value.attrs.href) : undefined;
});
</script>

<style>
.t-inlineimageview-content {
  /* background-color: var(--p-red-500); */
  max-width: 100%;
}
</style>