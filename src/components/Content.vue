<template>
	<div ref="content" class="t-content">
		<EditorToolbar :view-manager="viewManager" />
		<Splitter :initial-ratio="75" ref="splitter" :direction="splitDirection" :show-extra="showExtra">
			<template #main>
				<div class="t-content-topbar">
					<Select :options="editorState.mainTOC" optionLabel="label" option-value="key" v-model="mainPanel"
						style="border-radius: 0px; border-width: 0px 0px 1px;" @value-change="onChangeMain" />
					<Button icon="pi pi-table" severity="secondary" text @click="onChangeShowExtra" />
				</div>
				<div class="t-content-pane">
					<div ref="mainEditor" class="t-content-editor" />
				</div>
			</template>
			<template #extra>
				<div class="t-content-topbar">
					<Select :options="editorState.mainTOC" optionLabel="label" option-value="key" v-model="extraPanel"
						style="border-radius: 0px; border-width: 0px 0px 1px;" @value-change="onChangeExtra" />
					<Button icon="pi pi-objects-column" severity="secondary" text @click="changeDirection" />
				</div>
				<div class="t-content-pane">
					<div ref="extraEditor" class="t-content-editor" />
				</div>
			</template>
		</Splitter>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";

import { Select, Button } from "primevue";

import Splitter from "@/components/Splitter.vue";
import EditorToolbar from "@/components/EditorToolbar.vue";

import fb2Mapper, { DocumentBlocks } from "@/modules/fb2Mapper";
import editorState from "@/modules/editorState";
import { BodyManager } from "@/modules/viewManager";
import useEditorView from "@/modules/useEditorView";

const mainPanel = ref<string | undefined>("");
const extraPanel = ref<string | undefined>("");

const splitDirection = ref<"horizontal" | "vertical">("horizontal");
const showExtra = ref(true);

const viewManager = new BodyManager("mainEditor");
editorState.viewManagers.push(viewManager);

const mainEditor = useTemplateRef("mainEditor");
const extraEditor = useTemplateRef("extraEditor");

useEditorView(mainEditor, viewManager, "mainEditor");
useEditorView(extraEditor, viewManager, "extraEditor");

onMounted(() => {
	watch(editorState.mainTOC, () => {
		mainPanel.value = viewManager.getBodyByView("mainEditor");
		extraPanel.value = viewManager.getBodyByView("extraEditor");
	}, { immediate: true });
});

editorState.menu.push({
	key: "content",
	label: "Содержание",
	icon: "pi pi-fw pi-book",
	children: editorState.mainTOC
});

fb2Mapper.addPreprocessor(getBlocks);

function changeDirection() {
	splitDirection.value = splitDirection.value === "horizontal" ? "vertical" : "horizontal";
}

function onChangeShowExtra() {
	showExtra.value = !showExtra.value;
}

function onChangeMain(uid: string) {
	viewManager.switchViewToBody("mainEditor", uid);
}

function onChangeExtra(uid: string) {
	viewManager.switchViewToBody("extraEditor", uid);
}

function getBlocks(xmlDoc: Document, method: string) {
	const parts: DocumentBlocks = {};

	if (method === "parse") {
		const bodyElements = xmlDoc.getElementsByTagName("body");
		const mainDoc = xmlDoc.createElement("fb2");
		mainDoc.append(...bodyElements);
		parts["mainEditor"] = mainDoc;
	} else if (method === "serialize") {
		const [fb2] = xmlDoc.getElementsByTagName("FictionBook");
		parts["mainEditor"] = fb2;
	};

	return parts;
};

defineExpose({ getBlocks });
</script>

<style>
.t-content {
	display: flex;
	flex-grow: 1;
	flex-direction: column;
}

.t-content-pane {
	display: flex;
	height: calc(100% - 2.4rem - 1px);
}

.t-content-editor {
	position: relative;
	overflow-y: auto;
	flex-grow: 1;
	background: var(--p-inputtext-background);
}

.t-content-topbar {
	display: flex;
	justify-content: space-between;
	height: 2.4rem;
	background-color: var(--p-content-hover-background);
}
</style>