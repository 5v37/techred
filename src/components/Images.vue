<template>
	<div class="t-images-container">
		<div class="t-images-panel">
			<div v-for="(value, key) in images.items" :key="key" class="t-images-block">
				<Image class="img" :src=value.dataURL preview width="200" />
				<span class="t-images-caption">{{ key }}</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Image } from 'primevue';

import fileBroker from "../fileBroker";
import editorState from "../editorState";
import { addingNodes } from "../utils";
import { fb2ns, xlinkns } from "../fb2Model";

const images = editorState.images;

fileBroker.addSubscriber(parseContent, serializeContent, "fiction-book");

function parseContent(descElements: Element | undefined) {
	images.value.items = Object.create(null);

	if (!descElements) {
		return;
	};

	for (const item of descElements.children) {
		if (item.tagName === "binary") {
			const id = item.getAttribute("id");
			if (id) {
				images.value.addAsContent(id, item.textContent, item.getAttribute("content-type"));
			};
		};
	};
};
function serializeContent(xmlDoc: Document, target: Element) {
	const addElement = addingNodes(xmlDoc, fb2ns);

	let imageToSave: Set<string> = new Set;
	xmlDoc.querySelectorAll("image, inlineimage").forEach(element => {
		const id = element.getAttributeNS(xlinkns, "href")?.slice(1);
		if (id) {
			imageToSave.add(id);
		};
	});

	for (const [id, picture] of Object.entries(images.value.items)) {
		if (imageToSave.has(id)) {
			const attrs = [
				{ key: "id", value: id },
				{ key: "content-type", value: picture.type },
			];
			addElement(target, "binary", picture.content, false, attrs);
		};
	};
};

defineExpose({ parseContent, serializeContent });
</script>

<style>
.t-images-container {
	display: flex;
	flex-grow: 1;
	padding: 0.75rem;
}

.t-images-panel {
	display: flex;
	align-items: baseline;
	align-content: space-around;
	justify-content: space-evenly;
	flex-wrap: wrap;
	gap: 1rem;
	overflow-y: auto;
	padding: 1.125rem;
	width: 100%;
	border: thin solid var(--p-panel-border-color);
	border-radius: var(--p-panel-border-radius);
	background: var(--p-panel-background);
	color: var(--p-panel-color);
}

.t-images-block {
	display: flex;
	flex-direction: column;
}

.t-images-caption {
	text-align: center;
	padding: 0.25rem;
}
</style>