<template>
  <figure class="t-imageview-figure" :class="{ 'ProseMirror-selectednode': selected }">
    <div class="t-imageview-commands">
      <Button icon="pi pi-times" rounded severity="contrast" variant="text" size="small" @click="del" />
    </div>
    <img class="t-imageview-image" :src="src" :alt="alt" />
    <figcaption v-if="node.attrs.title" class="t-imageview-caption"> {{ node.attrs.title }} </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useNodeViewContext } from '@prosemirror-adapter/vue';

import { Button } from 'primevue'

import editorState from '../editorState';

const { node, selected, view, getPos } = useNodeViewContext();
const alt = computed(() => {
  return node.value.attrs.alt || src.value ? node.value.attrs.alt : "нет данных для отображения"; 
});
const src = computed(() => {
  return node.value.attrs.href ? editorState.images.value.getDataByHref(node.value.attrs.href) : undefined;
});

function del() {
  let tr = view.state.tr;
  const pos = getPos();
  if (pos !== undefined) {
    tr.delete(pos, pos + 1)
    view.dispatch(tr.scrollIntoView());
  }
};

</script>

<style>
.t-imageview-figure {
  border: thin solid var(--p-content-border-color);
  width: fit-content;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0.25rem var(--t-content-indent);
}

.t-imageview-image {
  min-height: 2rem;
  min-width: 2rem;
  max-width: 100%;
}

.t-imageview-caption {
  background-color: var(--p-content-border-color);
  width: 100%;
  font: italic smaller sans-serif;
  padding: 0.5rem;
  text-align: center;
}

.t-imageview-commands {
  position: absolute;
  left: calc(100% + 3px);
}
</style>