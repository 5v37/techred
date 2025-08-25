<template>
  <div style="position: relative;">
    <section :ref="contentRef" :id=node.attrs.id :class="{ 'ProseMirror-selectednode': selected }" />
    <span @click="openDialog" @mousedown.prevent class="t-sectionview-id" contenteditable="false">#{{ node.attrs.inid ||
      "<не установлен>" }}</span>
  </div>

  <Dialog v-model:visible=idDialog modal header="Укажите новый идентификатор" :closable="false">
    <InputText v-model.lazy.trim=newId v-keyfilter=NCNameFilter style="width: 100%;" />
    <template #footer>
      <Button type="button" label="Отмена" severity="secondary" @click="closeDialog"></Button>
      <Button type="button" label="Ок" @click="changeId"></Button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { useNodeViewContext } from '@prosemirror-adapter/vue';
import { Dialog, Button, InputText } from 'primevue';
import { ref } from 'vue';

const { contentRef, node, selected, view, getPos } = useNodeViewContext();
const NCNameFilter = { pattern: /^[\p{L}_][\p{L}\p{N}_.-]*$/u, validateOnly: true };

const idDialog = ref(false);
const newId = ref("");

function openDialog() {
  newId.value = node.value.attrs.inid || "";
  view.dom.blur();
  idDialog.value = true;
}

function closeDialog() {
  view.dom.focus({preventScroll: true});
  idDialog.value = false;
}

function changeId() {
  let tr = view.state.tr;
  const pos = getPos();
  if (pos !== undefined) {
    tr.setNodeAttribute(pos, "inid", newId.value)
    view.dispatch(tr);
  }
  closeDialog();
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
  cursor: pointer;
}
</style>