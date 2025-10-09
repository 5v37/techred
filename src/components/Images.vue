<template>
	<div ref="binary" class="t-images-container">
		<div class="t-images-panel">
			<div v-for="(value, key) in images.items" :key="key" class="t-images-block">
				<div class="t-images-errorwrapper">
					<Image class="img" :src=value.dataURL preview width="200" />
					<Message v-if="hasErrorId(value.newId, key)" severity="error" icon="pi pi-times-circle"
						class="t-images-errorId">{{ errorMessage }}</Message>
				</div>
				<InputText v-model.lazy=value.newId v-keyfilter=NCNameFilter class="t-images-caption"
					@focus="getContext(value.newId, key)" @change="validateId(value, key)" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onUpdated, ref, useTemplateRef } from 'vue';

import { Image, InputText, Message } from 'primevue';

import fb2Mapper, { DocumentBlocks } from "@/modules/fb2Mapper";
import editorState from "@/modules/editorState";
import { addingNodes } from "@/modules/utils";
import { fb2ns, xlinkns } from "@/modules/fb2Model";
import { NCNameFilter } from '@/modules/utils';
import { ImageSpec } from '@/types/images';

const images = editorState.images;
const errorMessage = ref("");

let currentKey: string | number;
let oldId: string;
let ids: Set<string>

function getContext(id: string, key: string | number) {
	currentKey = key;
	oldId = id;
	ids = editorState.getIds();
}

function validateId(image: ImageSpec, key: string | number) {
	if (hasErrorId(image.newId, key)) {
		image.newId = oldId;
	};
}

function hasErrorId(id: string, key: string | number) {
	if (key === currentKey && id !== oldId) {
		if (!id || !NCNameFilter.pattern.test(id)) {
			errorMessage.value = "Значение некорректно";
			return true;
		};
		if (ids.has(id)) {
			errorMessage.value = "Значение не уникально";
			return true;
		};
	}
	return false;
}

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

fb2Mapper.addPreprocessor(getBlocks);

function getBlocks(xmlDoc: Document, method: string) {
	toTop = method === "parse";

	const [fb2] = xmlDoc.getElementsByTagName("FictionBook");

	const parts: DocumentBlocks = {
		"fiction-book": fb2
	};

	return parts;
};

fb2Mapper.addProcessor(parseContent, serializeContent, "fiction-book", 2);

function parseContent(descElements: Element | undefined) {
	images.value.clear();

	if (!descElements) {
		return;
	};

	ids = editorState.getIds();
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
};
function serializeContent(xmlDoc: Document, target: Element) {
	const addElement = addingNodes(xmlDoc, fb2ns);

	let image, id = undefined;
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

defineExpose({ getBlocks, parseContent, serializeContent, });
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

.t-images-errorwrapper {
	display: flex;
	position: relative;
}

.t-images-errorId {
	position: absolute;
	bottom: 0;
	width: 100%;
}
</style>