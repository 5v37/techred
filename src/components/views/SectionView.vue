<template>
  <div style="position: relative;">
    <section :ref="contentRef" :id=node.attrs.id :class="{ 'ProseMirror-selectednode': selected }" />
    <span @click="openDialog" @mousedown.prevent contenteditable="false" class="t-sectionview-id">#{{ node.attrs.inid ||
      "<не установлен>" }}</span>
  </div>

  <IdInputDialog ref="inputDialog"/>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { useNodeViewContext } from '@prosemirror-adapter/vue';

import IdInputDialog from '../IdInputDialog.vue';

const { contentRef, node, selected, view, getPos } = useNodeViewContext();
const inputDialog = useTemplateRef('inputDialog');

function openDialog() {
  let pos = getPos();
  if (pos !== undefined && inputDialog.value) {
    inputDialog.value.openDialog(view, pos, node.value.attrs.inid)
  };  
}
</script>

<style>
.t-sectionview-id {
  position: absolute;
  line-height: 1rem;
  top: -0.5rem;
  left: 1rem;
  font-size: small;
  color: var(--p-text-muted-color);
  background: var(--p-content-background);
  user-select: none;
  cursor: pointer;
}
</style>