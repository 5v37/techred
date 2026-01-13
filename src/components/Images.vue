<template>
	<div ref="binary" class="t-images-container">
		<div class="t-images-panel">
			<div v-for="(value, key) in images.items" :key="key" class="t-images-block">
				<div class="t-images-error_wrapper">
					<Image class="img" :src=value.dataURL preview width="200" />
					<Message v-if="value.id.invalid" severity="error" icon="pi pi-times-circle"
						class="t-images-error_id">{{ value.id.error }}</Message>
				</div>
				<InputText v-model="value.id.draftValue" v-keyfilter=NCNameFilter class="t-images-caption"
					@input="updateMessage(value)" @change="confirmImageId(value)" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onUpdated, ref, useTemplateRef } from "vue";

import { Image, InputText, Message } from "primevue";

import fb2Mapper, { DocumentBlocks } from "@/modules/fb2Mapper";
import editorState from "@/modules/editorState";
import { addingNodes } from "@/modules/utils";
import { fb2ns, xlinkns } from "@/modules/fb2Model";
import { NCNameFilter, validateId, getIds, clearIdCache } from "@/modules/idManager";
import type { ImageSpec } from "@/types/images";
import modificationTracker from "@/modules/modificationTracker";

const images = editorState.images;
const isModified = ref(false);

function updateMessage(image: ImageSpec) {
	const ids = getIds(image.id.validValue);
	Object.assign(image.id, validateId(image.id.draftValue, ids, false));
}

function confirmImageId(image: ImageSpec) {
	if (image.id.invalid) {
		image.id.draftValue = image.id.validValue;
		updateMessage(image);
	} else {
		image.id.validValue = image.id.draftValue;
		clearIdCache();
		isModified.value = true;
	};
}

let toTop = false;
const binary = useTemplateRef("binary");
onUpdated(() => {
	if (toTop && binary.value && !binary.value.style.display) {
		binary.value.scrollTop = 0;
		toTop = false;
	}
});

editorState.menu.push({
	key: "images",
	label: "Изображения",
	icon: "pi pi-fw pi-images"
});

fb2Mapper.addPreprocessor(getBlocks);
fb2Mapper.addProcessor(parseContent, serializeContent, "fiction-book", 2);
modificationTracker.register(isModified);

function getBlocks(xmlDoc: Document, method: string) {
	toTop = method === "parse";

	const [fb2] = xmlDoc.getElementsByTagName("FictionBook");
	const parts: DocumentBlocks = {
		"fiction-book": fb2
	};

	return parts;
}

function parseContent(descElements: Element | undefined) {
	images.value.clear();
	isModified.value = false;

	if (!descElements) {
		return;
	};

	const ids = editorState.getIds(true);
	let id, newId = undefined;
	for (const item of descElements.children) {
		if (item.tagName === "binary") {
			id = item.getAttribute("id");
			if (id && item.textContent) {
				newId = images.value.addAsContent(id, item.textContent.replace(/[\n\r]/g, ""), item.getAttribute("content-type"), ids);
				if (newId) {
					ids.add(newId);
				};
			};
		};
	};
	clearIdCache();
}

function serializeContent(xmlDoc: Document, target: Element) {
	const addElement = addingNodes(xmlDoc, fb2ns);
	isModified.value = false;

	let image, id;
	let idToSave: Set<string> = new Set;
	xmlDoc.querySelectorAll("image, inlineimage").forEach(element => {
		id = element.getAttributeNS(xlinkns, "href")?.slice(1);
		if (id) {
			image = images.value.items[id];
			if (image) {
				if (image.id.validValue !== id) {
					id = image.id.validValue;
					element.setAttributeNS(xlinkns, "href", "#" + id);
				};
				if (!idToSave.has(id)) {
					idToSave.add(id);
					const attrs = [
						{ key: "id", value: id },
						{ key: "content-type", value: image.type }
					];
					addElement(target, "binary", image.content, false, attrs);
				}
			};
		};
	});
}

defineExpose({ getBlocks, parseContent, serializeContent });
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

.t-images-error_wrapper {
	display: flex;
	position: relative;
}

.t-images-error_id {
	position: absolute;
	bottom: 0;
	width: 100%;
}
</style>