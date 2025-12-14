<template>
	<div ref="content" class="t-content">
		<EditorToolbar editor-id="mainEditor" />
		<Splitter :initial-ratio="75" ref="splitter">
			<template #main>
				<div class="t-content-pane">
					<Editor :editor-id="children[0].key" />
				</div>
			</template>
			<template #extra>
				<div class="t-content-pane">
					<Editor v-for="item in children.slice(1)" :key="item.key" v-show="currentTab === item.key"
						:editor-id="item.key" />
				</div>
			</template>
		</Splitter>
		<div v-if="hasTabs" class="t-content-tabs">
			<button v-for="item in children.slice(1)" :key="item.key" @click="currentTab = item.key"
				class="t-content-tab" :class="{ 't-content-tab-active': currentTab === item.key }">
				{{ item.label }}
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, shallowReactive, reactive, nextTick } from "vue";

import type { TreeNode } from "primevue/treenode";

import Splitter from "@/components/Splitter.vue";
import Editor from "@/components/Editor.vue";
import EditorToolbar from "./EditorToolbar.vue";

import fb2Mapper, { DocumentBlocks } from "@/modules/fb2Mapper";
import editorState from "@/modules/editorState";
import { fb2ns } from "@/modules/fb2Model";
import { resetSharedHistory } from "@/extensions/sharedHistory";

const currentTab = editorState.currentBody;
fillBodies();

const children = reactive<TreeNode[]>([]);
for (const element of Object.values(editorState.bodies)) {
	children.push(element);
}
const hasTabs = computed(() => children.length > 2);
editorState.menu.push({
	key: 'content',
	label: 'Содержание',
	icon: 'pi pi-fw pi-book',
	children: children
});

fb2Mapper.addPreprocessor(getBlocks);

function fillBodies(length = 0) {
	if (length === 0) {
		editorState.bodies.body0 = shallowReactive({ key: "body0" });

	};
	if (length < 2) {
		editorState.bodies.body1 = shallowReactive({ key: "body1" });
	};
	currentTab.value = "body1";

	let count = Object.keys(editorState.bodies).length;
	while (length < count && count > 2) {
		let bodyKey = "body" + --count;
		delete editorState.bodies[bodyKey];
	};
}

function getBlocks(xmlDoc: Document, method: string) {
	const parts: DocumentBlocks = {};

	if (method === "parse") {
		const bodyElements = xmlDoc.getElementsByTagName("body");
		if (bodyElements.length !== children.length) {
			fb2Mapper.setUpdateProcessor(nextTick);
		}
		fillBodies(bodyElements.length);

		let count = 0;
		for (const element of bodyElements) {
			let bodyKey = "body" + count++;
			parts[bodyKey] = element;
			editorState.bodies[bodyKey] = shallowReactive({ key: bodyKey });
		};

		children.length = 0;
		for (const element of Object.values(editorState.bodies)) {
			children.push(element);
		}
		resetSharedHistory();
	} else if (method === "serialize") {
		const [fb2] = xmlDoc.getElementsByTagName("FictionBook");
		for (const key in editorState.bodies) {
			let newBody = xmlDoc.createElementNS(fb2ns, "body");
			fb2.appendChild(newBody);
			parts[key] = newBody;
		};
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
	height: 100%;
}

.t-content-tabs {
	display: flex;
	height: 2.5rem;
	border-top: 2px solid var(--p-content-border-color);
}

.t-content-tab {
	cursor: pointer;
	user-select: none;
	flex-shrink: 0;
	white-space: nowrap;
	padding-inline: 1.125rem;
	border-style: solid;
	border-width: 2px 0 0 0;
	margin: -2px 0 0 0;
	border-color: var(--p-content-border-color);
	color: var(--p-text-muted-color);
	background: transparent;
	outline-color: transparent;
	transition: background var(--p-transition-duration), border-color var(--p-transition-duration),
		color var(--p-transition-duration), outline-color var(--p-transition-duration),
		box-shadow var(--p-transition-duration);
}

.t-content-tab-active {
	border-color: var(--p-primary-color);
	color: var(--p-text-color);
}
</style>