<template>
	<div ref="binary" class="t-images-container">
		<div class="t-images-panel">
			<div v-for="value in imageRegistry.getActiveImages()" :key="value.imgid" class="t-images-block">
				<div class="t-images-error_wrapper">
					<Image class="img" :src=value.url preview width="200" />
					<Message v-if="value.id.invalid" severity="error" icon="pi pi-times-circle"
						class="t-images-error_id">{{ value.id.error }}</Message>
				</div>
				<div class="t-images-controls">
					<InputText v-model="value.id.draftValue" v-keyfilter=NCNameFilter class="t-images-caption"
						@input="updateMessage(value)" @change="confirmImageId(value)" />
					<Button icon="pi pi-upload" severity="contrast" v-tooltip="'Сохранить...'" class="t-images-save"
						@click="saveImage(value)" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, nextTick } from "vue";

import { Image, InputText, Message, Button } from "primevue";

import fb2Mapper, { DocumentBlocks } from "@/modules/fb2Mapper";
import editorState from "@/modules/editorState";
import { addingNodes, dataToBase64 } from "@/modules/utils";
import { fb2ns } from "@/modules/fb2Model";
import { NCNameFilter, validateId, getIds } from "@/modules/idManager";
import type { ImageSpec } from "@/modules/imageRegistry";
import modificationTracker from "@/modules/modificationTracker";
import imageRegistry from "@/modules/imageRegistry";

const props = defineProps<{ active: boolean; }>();
const binary = useTemplateRef("binary");
const isModified = ref(false);

let toTop = false;
let idsCache: Set<string> | undefined = undefined;
let idsCacheKey: string | undefined = undefined;

watch(() => props.active, async (isActive) => {
	if (isActive) {
		imageRegistry.collectActiveImages();

		if (toTop && binary.value) {
			await nextTick();
			binary.value.scrollTop = 0;
			toTop = false;
		}
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

function updateMessage(image: ImageSpec) {
	const ids = getCachedIds(image.id.validValue);
	Object.assign(image.id, validateId(image.id.draftValue, ids, false));
}

function confirmImageId(image: ImageSpec) {
	if (image.id.invalid) {
		image.id.draftValue = image.id.validValue;
		updateMessage(image);
	} else {
		image.id.validValue = image.id.draftValue;
		isModified.value = true;
	};

	idsCache = undefined;
	idsCacheKey = undefined;
}

function getCachedIds(excludeId?: string) {
	if (!idsCache || idsCacheKey !== excludeId) {
		idsCache = getIds(excludeId);
		idsCacheKey = excludeId;
	}

	return idsCache;
}

function saveImage(image: ImageSpec) {
	imageRegistry.exportToDialog(image.imgid);
}

function getBlocks(xmlDoc: Document, method: string) {
	if (method === "parse") {
		toTop = true;
		imageRegistry.clear();
	};

	const [fb2] = xmlDoc.getElementsByTagName("FictionBook");
	const parts: DocumentBlocks = {
		"fiction-book": fb2
	};

	return parts;
}

function parseContent(descElements: Element | undefined) {
	isModified.value = false;

	if (!descElements) {
		return;
	};

	const ids = getIds(undefined, true);
	let id;
	for (const item of descElements.children) {
		if (item.tagName === "binary") {
			id = item.getAttribute("id");
			if (id && item.textContent) {
				imageRegistry.addAsContent(id, item.textContent.replace(/[\n\r]/g, ""), item.getAttribute("content-type"), ids);
				if (id) {
					ids.add(id);
				};
			};
		};
	};

	if (props.active) {
		imageRegistry.collectActiveImages();
	}
}

function serializeContent(xmlDoc: Document, target: Element) {
	const addElement = addingNodes(xmlDoc, fb2ns);
	isModified.value = false;

	imageRegistry.collectActiveImages();
	for (const image of imageRegistry.getActiveImages()) {
		const attrs = [
			{ key: "id", value: image.id.validValue },
			{ key: "content-type", value: image.type }
		];
		addElement(target, "binary", dataToBase64(image.data), false, attrs);
	};
}

defineExpose({ getBlocks, parseContent, serializeContent });
</script>

<style>
.t-images-container {
	display: flex;
	flex-grow: 1;
	overflow-y: auto;
	padding: 0.75rem;
}

.t-images-panel {
	display: flex;
	align-items: baseline;
	align-content: space-around;
	justify-content: space-evenly;
	flex-wrap: wrap;
	gap: 1rem;
	padding: 1.125rem;
	width: 100%;
	min-height: min-content;
	border: thin solid var(--p-panel-border-color);
	border-radius: var(--p-panel-border-radius);
	background: var(--p-panel-background);
	color: var(--p-panel-color);
}

.t-images-block {
	display: flex;
	flex-direction: column;
}

.t-images-controls {
	display: flex;
	width: 200px;
	gap: 0.25rem;
	margin-top: 0.5rem;
}

.t-images-caption {
	flex: 1;
	min-width: 0;
}

.t-images-save {
	flex-shrink: 0;
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