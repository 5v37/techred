<template>
    <div ref="content" class="t-content-container">
        <Splitter layout="vertical">
            <SplitterPanel :size="75" :minSize="10" ref="main" style="overflow-y: auto;">
                <Editor editor-id="body0" />
            </SplitterPanel>
            <SplitterPanel :size="25" :minSize="10" ref="extra" style="overflow-y: auto;"
                :class="{ 't-content-has-tabs': hasTabs }">
                <Editor v-for="item in extraTabs" :key="item.key" v-show="currentTab === item.key"
                    :editor-id="item.key" />
                <div v-if="hasTabs" class="t-content-tabs">
                    <button v-for="item in extraTabs" :key="item.key" @click="currentTab = item.key"
                        class="t-content-tab" :class="{ 't-content-tab-active': currentTab === item.key }">
                        {{ item.label }}
                    </button>
                </div>
            </SplitterPanel>
        </Splitter>
    </div>
</template>

<script setup lang="ts">
import { onUpdated, useTemplateRef, ComponentPublicInstance, ref, computed, shallowReactive, ComputedRef, reactive } from "vue";

import { Splitter, SplitterPanel } from "primevue";
import { TreeNode } from "primevue/treenode";

import Editor from "./Editor.vue";

import fileBroker, { documentBlocks } from "../fileBroker";
import editorState from "../editorState";
import { fb2ns } from "../fb2Model";

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

fillBodies();
let extraTabs = ref<{ key: string, label: ComputedRef<string> }[]>([{ key: "body1", label: computed(() => editorState.bodies.body1.toc.label!) }]);
let currentTab = ref("body1");
const hasTabs = computed(() => extraTabs.value.length > 1);

const children = reactive<TreeNode[]>([]);
for (const element of Object.values(editorState.bodies)) {
    children.push(element.toc);
}
editorState.menu.push({
    key: 'content',
    label: 'Содержание',
    icon: 'pi pi-fw pi-book',
    isRoot: true,
    children: children
});

fileBroker.addDescriber(getParts);

function fillBodies(length = 0) {
    if (length === 0) {
        editorState.bodies.body0 = {
            name: "", toc: shallowReactive({ key: "body0" })
        };
    };
    if (length < 2) {
        editorState.bodies.body1 = {
            name: "notes", toc: shallowReactive({ key: "body1" })
        };
    };

    let count = Object.keys(editorState.bodies).length;
    while (length < count && count > 2) {
        let bodyKey = "body" + --count;
        fileBroker.delSubscriber(bodyKey);
        delete editorState.bodies[bodyKey];
    };
}

function getParts(xmlDoc: Document, method: string) {
    const parts: documentBlocks = {};

    if (method === "parse") {
        toTop = true;

        const bodyElements = xmlDoc.getElementsByTagName("body");
        fillBodies(bodyElements.length);
        currentTab.value = "body1";

        let newExtraTabs = [];
        let count = 0;
        for (const element of bodyElements) {
            let bodyKey = "body" + count++;
            parts[bodyKey] = element;
            editorState.bodies[bodyKey] = { name: element.getAttribute("name") ?? "", toc: shallowReactive({ key: bodyKey }) };
            if (count > 1) {
                newExtraTabs.push({ key: bodyKey, label: computed(() => editorState.bodies[bodyKey].toc.label!) });
            };
        };

        if (newExtraTabs.length) {
            extraTabs.value = newExtraTabs;
        } else {
            extraTabs.value = [{ key: "body1", label: computed(() => editorState.bodies.body1.toc.label!) }];
        }

        children.length = 0;
        for (const element of Object.values(editorState.bodies)) {
            children.push(element.toc);
        }
    } else if (method === "serialize") {
        const [fb2] = xmlDoc.getElementsByTagName("FictionBook");
        for (const key in editorState.bodies) {
            let newBody = xmlDoc.createElementNS(fb2ns, "body");
            if (editorState.bodies[key].name) {
                newBody.setAttribute("name", editorState.bodies[key].name);
            };
            fb2.appendChild(newBody);
            parts[key] = newBody;
        };
    };

    return parts;
};

defineExpose({ getParts });
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