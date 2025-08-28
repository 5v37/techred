<template>
  <div style="position: relative;">
    <section :ref="contentRef" :id=node.attrs.id :class="{ 'ProseMirror-selectednode': selected }" />
    <span @click="openDialog" @mousedown.prevent class="t-sectionview-id" contenteditable="false">#{{ node.attrs.inid ||
      "<не установлен>" }}</span>
  </div>

  <Dialog v-model:visible=idDialog modal :closable="false" :close-on-escape="false" class="t-ui-dialog"
    header="Укажите новый идентификатор">
    <InputText v-model=newId v-keyfilter=NCNameFilter :invalid="invalidId" style="width: 100%;" />
    <template #footer>
      <Message v-if="invalidId" severity="error" variant="simple" style="margin-inline-end: auto;">Значение не
        уникально</Message>
      <Button type="button" label="Отмена" severity="secondary" @click="closeDialog"></Button>
      <Button type="button" label="Ок" :disabled="invalidId" @click="changeId"></Button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Dialog, Button, InputText, Message } from 'primevue';
import { useNodeViewContext } from '@prosemirror-adapter/vue';

import { NCNameFilter } from '../../utils';
import editorState from '../../editorState';

const { contentRef, node, selected, view, getPos } = useNodeViewContext();

let ids: Set<string>;
const idDialog = ref(false);
const newId = ref("");
const invalidId = computed(() => {
  return newId.value !== node.value.attrs.inid && ids.has(newId.value);
});

function keyListener(event: KeyboardEvent) {
  if (event.code === "Escape") {
    closeDialog();
  } else if (event.code === "Enter") {
    changeId();
  } else {
    return;
  };
  event.preventDefault();
}

function openDialog() {
  ids = editorState.getIds();
  newId.value = node.value.attrs.inid || "";
  view.dom.blur();
  idDialog.value = true;
  addEventListener("keydown", keyListener);
}

function closeDialog() {
  view.dom.focus({ preventScroll: true });
  idDialog.value = false;
  removeEventListener("keydown", keyListener);
}

function changeId() {
  if (invalidId.value) {
    return;
  };
  if ((newId.value || node.value.attrs.inid) && newId.value !== node.value.attrs.inid) {
    let tr = view.state.tr;
    const pos = getPos();
    if (pos !== undefined) {
      tr.setNodeAttribute(pos, "inid", newId.value)
      view.dispatch(tr);
    };
  };
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