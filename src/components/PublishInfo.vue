<template>
    <Panel toggleable>
        <template #header>
            <div :id=tag class="t-ui-panelheader">{{ header }}</div>
        </template>

        <div class="t-ui-container">
            <div class="t-ui-field">
                <label>Заглавие</label>
                <InputText v-model.lazy.trim=bookName />
            </div>

            <div class="t-ui-field">
                <label>Издательство</label>
                <InputText v-model.lazy.trim=publisher />
            </div>

            <div class="t-ui-group">
                <div class="t-ui-field">
                    <label>Город</label>
                    <InputText v-model.lazy.trim=city />
                </div>

                <div class="t-ui-field t-ui-grow05">
                    <label>Год</label>
                    <DatePicker v-model="year" view="year" dateFormat="yy" />
                </div>

                <div class="t-ui-field">
                    <label>ISBN</label>
                    <InputText v-model.lazy.trim=ISBN />
                </div>
            </div>

            <div class="t-ui-field">
                <label>Серии</label>
                <Sequences v-model="sequences" />
            </div>
        </div>
    </Panel>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import Sequences from './Sequences.vue'

import { Panel, InputText, DatePicker } from 'primevue';

import { addingNodes } from '../utils';
import { fb2ns } from '../fb2Model';
import Series from '../types/series';
import fb2Mapper from '../fb2Mapper';

interface StateDescription {
    bookName: string,
    publisher: string,
    city: string,
    year: Date | undefined,
    ISBN: string,
    sequences: Series[]
};

function initialStateDescription(): StateDescription {
    return {
        bookName: "",
        publisher: "",
        city: "",
        year: undefined,
        ISBN: "",
        sequences: []
    };
};

export default defineComponent({
    name: "PublishInfo",
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
        InputText,
        DatePicker,
        Sequences,
        Panel
    },
    data(): StateDescription {
        return initialStateDescription();
    },
    created() {
        fb2Mapper.addProcessor(this.parseContent, this.serializeContent, this.$props.tag);
    },
    methods: {
        parseContent(descElement: Element | undefined) {
            Object.assign(this.$data, initialStateDescription());

            if (!descElement) {
                return;
            }

            for (const item of descElement.children) {
                if (item.tagName === "book-name" && item.textContent) {
                    this.bookName = item.textContent.trim();
                } else if (item.tagName === "publisher" && item.textContent) {
                    this.publisher = item.textContent.trim();
                } else if (item.tagName === "city" && item.textContent) {
                    this.city = item.textContent.trim();
                } else if (item.tagName === "year" && item.textContent) {
                    this.year = new Date(item.textContent);
                } else if (item.tagName === "isbn" && item.textContent) {
                    this.ISBN = item.textContent.trim();
                } else if (item.tagName === "sequence") {
                    const name = item.getAttribute("name")?.trim();
                    const number = item.getAttribute("number");
                    if (name) {
                        this.sequences.push(new Series(name, number));
                    };
                };
            };
        },
        serializeContent(xmlDoc: Document, publishInfo: Element) {
            const addElement = addingNodes(xmlDoc, fb2ns);

            addElement(publishInfo, "book-name", this.bookName);
            addElement(publishInfo, "publisher", this.publisher);
            addElement(publishInfo, "city", this.city);
            if (this.year) {
                addElement(publishInfo, "year", `${this.year.getFullYear()}`);
            };
            addElement(publishInfo, "isbn", this.ISBN);

            for (const series of this.sequences) {
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
    }
})
</script>