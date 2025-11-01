<template>
    <div ref="content" class="t-content-container">
        <Splitter layout="vertical">
            <SplitterPanel :size="75" :minSize="10" ref="main" class="t-link-tooltip-root" style="overflow-y: auto;">
                <Editor :editor-id="children[0].key" />
            </SplitterPanel>
            <SplitterPanel :size="25" :minSize="10" ref="extra" class="t-link-tooltip-root" style="overflow-y: auto;"
                :class="{ 't-content-has-tabs': hasTabs }">
                <Editor v-for="item in children.slice(1)" :key="item.key" v-show="currentTab === item.key"
                    :editor-id="item.key" />
                <div v-if="hasTabs" class="t-content-tabs">
                    <button v-for="item in children.slice(1)" :key="item.key" @click="currentTab = item.key"
                        class="t-content-tab" :class="{ 't-content-tab-active': currentTab === item.key }">
                        {{ item.label }}
                    </button>
                </div>
            </SplitterPanel>
        </Splitter>
    </div>
</template>

<script setup lang="ts">
import { onUpdated, useTemplateRef, ComponentPublicInstance, computed, shallowReactive, reactive, nextTick } from "vue";

import { Splitter, SplitterPanel } from "primevue";
import type { TreeNode } from "primevue/treenode";

import Editor from "@/components/Editor.vue";

import fb2Mapper, { DocumentBlocks } from "@/modules/fb2Mapper";
import editorState from "@/modules/editorState";
import { fb2ns } from "@/modules/fb2Model";
import { resetSharedHistory } from "@/modules/pm/sharedHistory";

let toTop = false;
const content = useTemplateRef('content');
const main = useTemplateRef<ComponentPublicInstance>('main');
const extra = useTemplateRef<ComponentPublicInstance>('extra');
onUpdated(() => {
    if (toTop && content.value && !content.value.style.display) {
        main.value!.$el.scrollTop = 0;
        extra.value!.$el.scrollTop = 0;
        toTop = false;
    }
});

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
        toTop = true;

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
.t-content-container {
    display: flex;
    flex-grow: 1;
}

.t-content-has-tabs {
    margin-bottom: 2.5rem;
}

.t-content-tabs {
    position: fixed;
    bottom: 0;
    width: 100%;
    border-top: 2px solid var(--p-splitter-border-color);
    height: 2.5rem;
    display: flex;
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