<template>
  <div style="position: relative;">
    <section :ref="contentRef" :id=node.attrs.id :class="{ 'ProseMirror-selectednode': selected }" />
    <span @click="openDialog" @mousedown.prevent contenteditable="false" class="t-sectionview-id">#{{ node.attrs.inid ||
      "<не установлен>" }}</span>
  </div>  
</template>

<script setup lang="ts">
import { useNodeViewContext } from '@prosemirror-adapter/vue';
import ui from '../../ui';

const { contentRef, node, selected, view, getPos } = useNodeViewContext();

function openDialog() {
  const pos = getPos();
  if (pos !== undefined) {
    ui.openIdInputDialog(view.state, view.dispatch, pos, node.value.attrs.inid, "inid")
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