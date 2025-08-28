<template>
	<div ref="binary" class="t-images-container">
		<div class="t-images-panel">
			<div v-for="(value, key) in images.items" :key="key" class="t-images-block">
				<Image class="img" :src=value.dataURL preview width="200" />
				<InputText v-model.lazy.trim=value.newId :invalid="!value.newId" class="t-images-caption"
					v-keyfilter=NCNameFilter />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onUpdated, useTemplateRef } from 'vue';

import { Image, InputText } from 'primevue';

import fileBroker, { documentBlocks } from "../fileBroker";
import editorState from "../editorState";
import { addingNodes } from "../utils";
import { fb2ns, xlinkns } from "../fb2Model";
import { NCNameFilter } from '../utils';

const images = editorState.images;

let toTop = false;
const binary = useTemplateRef('binary');
onUpdated(() => {
	if (toTop && binary.value && !binary.value.style.display) {
		binary.value.scrollTop = 0;
		toTop = false;
	}
});

editorState.menu.push({
	key: 'images',
	label: 'Изображения',
	icon: 'pi pi-fw pi-images'
});

fileBroker.addDescriber(getParts);

function getParts(xmlDoc: Document, method: string) {
	toTop = method === "parse";

	const [fb2] = xmlDoc.getElementsByTagName("FictionBook");

	const parts: documentBlocks = {
		"fiction-book": fb2
	};

	return parts;
};

fileBroker.addSubscriber(parseContent, serializeContent, "fiction-book");

function parseContent(descElements: Element | undefined) {
	images.value.clear();

	if (!descElements) {
		return;
	};

	for (const item of descElements.children) {
		if (item.tagName === "binary") {
			const id = item.getAttribute("id");
			if (id && item.textContent) {
				images.value.addAsContent(id, item.textContent.replace(/[\n\r]/g, ""), item.getAttribute("content-type"));
			};
		};
	};
};
function serializeContent(xmlDoc: Document, target: Element) {
	const addElement = addingNodes(xmlDoc, fb2ns);

	let image = undefined, id = undefined;
	let idToSave: Set<string> = new Set;
	xmlDoc.querySelectorAll("image, inlineimage").forEach(element => {
		id = element.getAttributeNS(xlinkns, "href")?.slice(1);
		if (id) {
			image = images.value.items[id];
			if (image) {
				if (image.newId && image.newId !== id) {
					id = image.newId;
					element.setAttributeNS(xlinkns, "href", "#" + id);
				};
				if (!idToSave.has(id)) {
					idToSave.add(id);
					const attrs = [
						{ key: "id", value: id },
						{ key: "content-type", value: image.type },
					];
					addElement(target, "binary", image.content, false, attrs);
				}
			};
		};
	});
};

defineExpose({ getParts, parseContent, serializeContent, });
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
	margin-top: 0.5rem;
}
</style>