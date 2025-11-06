<template>
    <Panel toggleable>
        <template #header>
            <div :uid=tag class="t-ui-panelheader">{{ header }}</div>
        </template>

        <div class="t-ui-container">
            <div class="t-ui-field">
                <label>Заглавие</label>
                <InputText v-model.trim="model.bookName" />
            </div>

            <div class="t-ui-field">
                <label>Издательство</label>
                <InputText v-model.trim="model.publisher" />
            </div>

            <div class="t-ui-group">
                <div class="t-ui-field">
                    <label>Город</label>
                    <InputText v-model.trim="model.city" />
                </div>

                <div class="t-ui-field t-ui-grow05">
                    <label>Год</label>
                    <DatePicker v-model="model.year" view="year" dateFormat="yy" fluid/>
                </div>

                <div class="t-ui-field">
                    <label>ISBN</label>
                    <InputText v-model.trim="model.ISBN" />
                </div>
            </div>

            <div class="t-ui-field">
                <label>Серии</label>
                <Sequences v-model="model.sequences" />
            </div>
        </div>
    </Panel>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { Panel, InputText, DatePicker } from "primevue";

import Sequences from "./Sequences.vue";

import { addingNodes } from "@/modules/utils";
import { fb2ns } from "@/modules/fb2Model";
import Series from "@/types/series";
import fb2Mapper from "@/modules/fb2Mapper";
import modificationTracker from "@/modules/modificationTracker";

const model = ref(initialStateDescription());
const props = defineProps<{
    tag: string
    header: string
}>();

fb2Mapper.addProcessor(parseContent, serializeContent, props.tag);
modificationTracker.register(model);

function initialStateDescription() {
    return {
        bookName: "",
        publisher: "",
        city: "",
        year: null as Date | null,
        ISBN: "",
        sequences: new Array<Series>()
    };
};

function parseContent(descElement: Element | undefined) {
    model.value = initialStateDescription();
    const data = model.value;

    if (!descElement) {
        return;
    }

    for (const item of descElement.children) {
        if (item.tagName === "book-name" && item.textContent) {
            data.bookName = item.textContent.trim();
        } else if (item.tagName === "publisher" && item.textContent) {
            data.publisher = item.textContent.trim();
        } else if (item.tagName === "city" && item.textContent) {
            data.city = item.textContent.trim();
        } else if (item.tagName === "year" && item.textContent) {
            data.year = new Date(item.textContent);
        } else if (item.tagName === "isbn" && item.textContent) {
            data.ISBN = item.textContent.trim();
        } else if (item.tagName === "sequence") {
            const name = item.getAttribute("name")?.trim();
            const number = item.getAttribute("number");
            if (name) {
                data.sequences.push(new Series(name, number));
            };
        };
    };
}

function serializeContent(xmlDoc: Document, publishInfo: Element) {
    const data = model.value;
    const addElement = addingNodes(xmlDoc, fb2ns);

    addElement(publishInfo, "book-name", data.bookName);
    addElement(publishInfo, "publisher", data.publisher);
    addElement(publishInfo, "city", data.city);
    if (data.year) {
        addElement(publishInfo, "year", `${data.year.getFullYear()}`);
    };
    addElement(publishInfo, "isbn", data.ISBN);

    for (const series of data.sequences) {
        if (series.name) {
            const attrs = [
                { key: "name", value: series.name },
                { key: "number", value: series.number?.toString() },
            ]
            addElement(publishInfo, "sequence", "", true, attrs);
        };
    };

    if (!publishInfo.textContent) {
        publishInfo.remove();
    };
}

defineExpose({ parseContent, serializeContent });
</script>