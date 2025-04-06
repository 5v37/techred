<template>
  <figure class="t-imageview-figure" :class="{ 'ProseMirror-selectednode': selected }">
    <img class="t-imageview-image" :src="node.attrs.src" :alt="node.attrs.alt" />
    <figcaption v-if="node.attrs.title" class="t-imageview-caption"> {{ node.attrs.title }} </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { useNodeViewContext } from '@prosemirror-adapter/vue';

const { node, selected } = useNodeViewContext();
</script>

<style>
.t-imageview-figure {
  border: thin solid var(--p-content-border-color);
  width: fit-content;

  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0.25rem var(--t-content-indent);
}

.t-imageview-image {
  max-width: 100%;
}

.t-imageview-caption {
  background-color: var(--p-content-border-color);
  width: 100%;
  font: italic smaller sans-serif;
  padding: 0.5rem;
  text-align: center;
}
</style>