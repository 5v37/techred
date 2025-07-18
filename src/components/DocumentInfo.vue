<template>
    <Panel toggleable>
        <template #header>
            <div :id=tag class="t-ui-panelheader">{{ header }}</div>
        </template>

        <div class="t-ui-container">
            <div class="t-ui-group">
                <div class="t-ui-field">
                    <label>Версия</label>
                    <InputNumber v-model.lazy=fileVers :useGrouping="false" :minFractionDigits="1" locale="en-US"
                        fluid />
                </div>

                <div class="t-ui-field">
                    <label>Дата</label>
                    <ComplexDatePicker v-model:date="date" v-model:date-value="dateValue" />
                </div>

                <div class="t-ui-field">
                    <label>Идентификатор</label>
                    <InputText v-model.lazy=fileID disabled />
                </div>
            </div>

            <div class="t-ui-field">
                <label>История изменений</label>
                <Editor editor-id="history" annotation class="t-ui-texteditor" />
            </div>

            <div class="t-ui-field">
                <label>Авторы</label>
                <Persons v-model="fileAuthors" />
            </div>

            <div class="t-ui-field">
                <label>Использованные программы</label>
                <InputText v-model.lazy.trim=programUsed />
            </div>

            <div class="t-ui-field">
                <label>Источник</label>
                <InputText v-model.lazy.trim=srcOCR />
            </div>

            <div class="t-ui-field">
                <label>Ссылки на источник</label>
                <InputText v-model.lazy.trim=srcURL[0] />
            </div>

            <div class="t-ui-field">
                <label>Владельцы</label>
                <Persons v-model="publishers" />
            </div>
        </div>
    </Panel>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import Persons from './Persons.vue';
import Editor from './Editor.vue';
import ComplexDatePicker from './ComplexDatePicker.vue';

import { Panel, Chip, Button, SelectButton, Popover, Select, FloatLabel, Tree, Image, InputText, InputNumber } from 'primevue';

import PersonInfo from '../types/personInfo';
import { addingNodes } from '../utils';
import { fb2ns } from '../fb2Model';
import fileBroker from '../fileBroker';

interface StateDescription {
    fileAuthors: PersonInfo[],
    programUsed: string,
    date: string,
    dateValue: string,
    fileVers: number,
    fileID: string,
    srcOCR: string,
    srcURL: string[],
    publishers: PersonInfo[],
};

function initialStateDescription(): StateDescription {
    return {
        fileAuthors: [],
        programUsed: "",
        date: "",
        dateValue: "",
        fileVers: 0.1,
        fileID: self.crypto.randomUUID(),
        srcOCR: "",
        srcURL: [],
        publishers: [],
    };
};

export default defineComponent({
    name: "Description",
    props: {
        header: {
            type: String,
            required: true
        },
        tag: {
            type: String,
            required: true
        }
    },
    exposed: ['parseContent', 'serializeContent'],
    emits: [],
    components: {
        Persons,
        InputText,
        FloatLabel,
        Button,
        Select,
        SelectButton,
        Chip,
        Popover,
        Tree,
        ComplexDatePicker,
        Image,
        Panel,
        Editor,
        InputNumber
    },
    data(): StateDescription {
        return initialStateDescription();
    },
    created() {
        fileBroker.addSubscriber(this.parseContent, this.serializeContent, this.$props.tag);
    },
    methods: {
        parseContent(descElement: Element | undefined) {
            Object.assign(this.$data, initialStateDescription());

            if (!descElement) {
                return;
            };

            for (const item of descElement.children) {
                if (item.tagName === "author") {
                    this.fileAuthors.push(new PersonInfo(item));
                } else if (item.tagName === "program-used" && item.textContent) {
                    this.programUsed = item.textContent.trim();
                } else if (item.tagName === "date" && item.textContent) {
                    this.dateValue = item.getAttribute("value") ?? "";
                    this.date = item.textContent.trim();
                } else if (item.tagName === "src-url" && item.textContent) {
                    this.srcURL.push(item.textContent.trim());
                } else if (item.tagName === "src-ocr" && item.textContent) {
                    this.srcOCR = item.textContent.trim();
                } else if (item.tagName === "id" && item.textContent) {
                    this.fileID = item.textContent;
                } else if (item.tagName === "version" && item.textContent) {
                    this.fileVers = +item.textContent;
                } else if (item.tagName === "publisher") {
                    this.publishers.push(new PersonInfo(item));
                };
            };
        },
        serializeContent(xmlDoc: Document, documentInfo: Element) {
            const addElement = addingNodes(xmlDoc, fb2ns);

            const authors = this.fileAuthors.length ? this.fileAuthors : [new PersonInfo];
            for (const author of authors) {
                const authorNode = xmlDoc.createElementNS(fb2ns, "author");
                for (const prop of author.props()) {
                    addElement(authorNode, prop.key, prop.value, prop.required);
                };
                documentInfo.appendChild(authorNode);
            };

            addElement(documentInfo, "program-used", this.programUsed);
            addElement(documentInfo, "date", this.date, true, [{ key: "value", value: this.dateValue || undefined }]);

            for (const element of this.srcURL) {
                addElement(documentInfo, "src-url", element);
            };

            addElement(documentInfo, "src-ocr", this.srcOCR);
            addElement(documentInfo, "id", this.fileID, true);
            addElement(documentInfo, "version", this.fileVers + (Number.isInteger(this.fileVers) ? ".0" : ""), true);

            const [history] = documentInfo.getElementsByTagName("history");
            documentInfo.appendChild(history);

            for (const publisher of this.publishers) {
                const publisherNode = xmlDoc.createElementNS(fb2ns, "publisher");
                for (const prop of publisher.props()) {
                    addElement(publisherNode, prop.key, prop.value, prop.required);
                };
                documentInfo.appendChild(publisherNode);
            };
        }
    }
})
</script>