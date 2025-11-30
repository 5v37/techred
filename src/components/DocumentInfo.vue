<template>
    <Panel toggleable>
        <template #header>
            <div :uid=tag class="t-ui-panelheader">{{ header }}</div>
        </template>

        <div class="t-ui-container">
            <div class="t-ui-group">
                <div class="t-ui-field">
                    <label>Версия</label>
                    <InputNumber v-model="model.fileVers" :useGrouping="false" :minFractionDigits="1" locale="en-US"
                        fluid />
                </div>

                <div class="t-ui-field">
                    <label>Дата</label>
                    <ComplexDatePicker v-model:date="model.date" v-model:date-value="model.dateValue" />
                </div>

                <div class="t-ui-field">
                    <label>Идентификатор</label>
                    <InputText v-model="model.fileID" disabled />
                </div>
            </div>

            <div class="t-ui-field">
                <label>История изменений</label>
                <EmbeddedEditor editor-id="history"/>
            </div>

            <div class="t-ui-field">
                <label>Авторы</label>
                <Persons v-model="model.fileAuthors" />
            </div>

            <div class="t-ui-field">
                <label>Использованные программы</label>
                <InputText v-model.trim="model.programUsed" />
            </div>

            <div class="t-ui-field">
                <label>Источник</label>
                <InputText v-model.trim="model.srcOCR" />
            </div>

            <div class="t-ui-field">
                <label>Ссылки на источник</label>
                <div class="t-ui-long-chipcontainer">
                    <Chip v-for="(srcURL, index) in model.srcURLs" :key="srcURL.id" removable @remove="delSrcURL(index)">
                        <div class="t-ui-long-chipgroup">
                            <InputText v-model.trim="srcURL.url" fluid />
                        </div>
                    </Chip>
                    <Button type="button" icon="pi pi-plus" @click="addSrcURL()" v-tooltip="'Добавить'" />
                </div>
            </div>

            <div class="t-ui-field">
                <label>Владельцы</label>
                <Persons v-model="model.publishers" />
            </div>
        </div>
    </Panel>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { Panel, Chip, Button, InputText, InputNumber } from "primevue";

import Persons from "./Persons.vue";
import EmbeddedEditor from "./EmbeddedEditor.vue";
import ComplexDatePicker from "./ComplexDatePicker.vue";

import PersonInfo from "@/types/personInfo";
import { addingNodes } from "@/modules/utils";
import { fb2ns } from "@/modules/fb2Model";
import fb2Mapper from "@/modules/fb2Mapper";
import modificationTracker from "@/modules/modificationTracker";

let idxSrcURL = 0;

const model = ref(initialStateDescription());
const props = defineProps<{
    tag: string
    header: string
}>();

fb2Mapper.addProcessor(parseContent, serializeContent, props.tag);
modificationTracker.register(model);

function initialStateDescription() {
    return {
        fileAuthors: new Array<PersonInfo>,
        programUsed: "Techred " + __APP_VERSION__,
        date: "",
        dateValue: "",
        fileVers: 0.1,
        fileID: self.crypto.randomUUID() as string,
        srcOCR: "",
        srcURLs: new Array<{ url: string, id: number }>(),
        publishers: new Array<PersonInfo>(),
    };
};

function addSrcURL() {
    model.value.srcURLs.push({ url: "", id: ++idxSrcURL });
}

function delSrcURL(index: number) {
    model.value.srcURLs.splice(index, 1);
}

function parseContent(descElement: Element | undefined) {
    model.value = initialStateDescription();
    const data = model.value;

    if (!descElement) {        
        return;
    };

    for (const item of descElement.children) {
        if (item.tagName === "author") {
            data.fileAuthors.push(new PersonInfo(item));
        } else if (item.tagName === "program-used" && item.textContent) {
            data.programUsed = item.textContent.trim();
        } else if (item.tagName === "date" && item.textContent) {
            data.dateValue = item.getAttribute("value") ?? "";
            data.date = item.textContent.trim();
        } else if (item.tagName === "src-url" && item.textContent) {
            data.srcURLs.push({ url: item.textContent.trim(), id: ++idxSrcURL });
        } else if (item.tagName === "src-ocr" && item.textContent) {
            data.srcOCR = item.textContent.trim();
        } else if (item.tagName === "id" && item.textContent) {
            data.fileID = item.textContent;
        } else if (item.tagName === "version" && item.textContent) {
            data.fileVers = +item.textContent;
        } else if (item.tagName === "publisher") {
            data.publishers.push(new PersonInfo(item));
        };
    };

    if (!data.programUsed.includes("Techred")) {
        data.programUsed += `${data.programUsed.length > 0 ? ", " : ""}Techred ${__APP_VERSION__}`;
    };
}

function serializeContent(xmlDoc: Document, documentInfo: Element) {
    const data = model.value;
    const addElement = addingNodes(xmlDoc, fb2ns);    

    const authors = data.fileAuthors.length ? data.fileAuthors : [new PersonInfo];
    for (const author of authors) {
        const authorNode = xmlDoc.createElementNS(fb2ns, "author");
        for (const prop of author.props()) {
            addElement(authorNode, prop.key, prop.value, prop.required);
        };
        documentInfo.appendChild(authorNode);
    };

    addElement(documentInfo, "program-used", data.programUsed);
    addElement(documentInfo, "date", data.date, true, [{ key: "value", value: data.dateValue || undefined }]);

    for (const element of data.srcURLs) {
        addElement(documentInfo, "src-url", element.url);
    };

    addElement(documentInfo, "src-ocr", data.srcOCR);
    addElement(documentInfo, "id", data.fileID, true);
    addElement(documentInfo, "version", data.fileVers + (Number.isInteger(data.fileVers) ? ".0" : ""), true);

    const [history] = documentInfo.getElementsByTagName("history");
    documentInfo.appendChild(history);

    for (const publisher of data.publishers) {
        const publisherNode = xmlDoc.createElementNS(fb2ns, "publisher");
        for (const prop of publisher.props()) {
            addElement(publisherNode, prop.key, prop.value, prop.required);
        };
        documentInfo.appendChild(publisherNode);
    };
}

defineExpose({ parseContent, serializeContent });
</script>