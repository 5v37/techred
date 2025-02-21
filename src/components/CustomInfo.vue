<template>
    <Panel toggleable>
        <template #header>
            <div :id=tag class="t-ui-panelheader">{{ header }}</div>
        </template>

        <div class="t-custominfo-group">
            <Chip v-for="(custom, index) in model" :key="custom.id" removable @remove="del(index)">
                <div class="t-ui-chipgroup t-ui-grow">
                    <div class="t-custominfo-field">
                        <label>Свойство</label>
                        <InputText v-model.lazy=custom.type fluid />
                    </div>
                    <Textarea v-model.lazy=custom.value autoResize rows="2" fluid />
                </div>
            </Chip>
            <Button type="button" icon="pi pi-plus" @click="add()" v-tooltip="'Добавить'" />
        </div>
    </Panel>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { Panel, Chip, Textarea, InputText, Button } from 'primevue';

import Customs from '../types/customs';
import { addingNodes } from '../utils';
import { fb2ns } from '../fb2Model';
import fileBroker from '../fileBroker';

const model = ref<Customs[]>([]);
const props = defineProps<{
    tag: string
    header: string
}>();

function add() {
    model.value.push(new Customs);
};
function del(index: number) {
    model.value.splice(index, 1);
};

fileBroker.addSubscriber(parseContent, serializeContent, "description");

function parseContent(descElements: Element | undefined) {
    model.value = [];

    if (!descElements) {
        return;
    };

    for (const item of descElements.children) {
        if (item.tagName === props.tag) {
            model.value.push(new Customs(item.getAttribute("info-type") ?? "", item.textContent ?? ""));
        }
    };
};
function serializeContent(xmlDoc: Document, target: Element) {
    const addElement = addingNodes(xmlDoc, fb2ns);

    for (const custom of model.value) {
        addElement(target, props.tag, custom.value, false, [{ key: "info-type", value: custom.type }]);
    };
};

defineExpose({ parseContent, serializeContent });
</script>

<style>
.t-custominfo-field {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex: 1;
}

.t-custominfo-group {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
}
</style>
