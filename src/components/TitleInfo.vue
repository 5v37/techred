<template>
    <Panel toggleable :collapsed="isEmpty">
        <template #header>
            <div :id=tag class="t-ui-panelheader">{{ header }}</div>
        </template>

        <div class="t-ui-container">
            <div class="t-ui-field">
                <label>Заглавие</label>
                <InputText v-model.lazy=bookTitle />
            </div>

            <div class="t-ui-field">
                <label>Автор</label>
                <Persons v-model="autors" />
            </div>

            <div class="t-ui-group">
                <div class="t-ui-field t-ui-grow0">
                    <label>Обложка</label>
                    <div class="t-ui-group">
                        <div v-show="!hasCover" class="t-titleinfo-nocover">ОТСУТСТВУЕТ</div>
                        <Image v-show="hasCover" :src="cover" alt="Обложка" preview width="200" />
                        <div class="t-titleinfo-coverbuttons">
                            <Button icon="pi pi-file-import" @click="selectCover" severity="contrast"
                                v-tooltip="'Выбрать...'" />
                            <Button v-show="hasCover" icon="pi pi-upload" @click="saveCover" severity="contrast"
                                v-tooltip="'Сохранить...'" />
                            <Button v-show="hasCover" icon="pi pi-times-circle" @click="deleteCover" severity="contrast"
                                v-tooltip="'Удалить'" />
                        </div>
                    </div>
                </div>
                <div class="t-ui-field">
                    <label>Аннотация</label>
                    <Editor ref="annotationEditor" :editor-id=annotationId annotation class="t-ui-texteditor" />
                </div>
            </div>

            <div class="t-ui-group">
                <div class="t-ui-field">
                    <label>Язык</label>
                    <Select v-model="selectedLang" :options="languages" optionLabel="name" filter showClear />
                </div>
                <div class="t-ui-field">
                    <label>Язык оригинала</label>
                    <Select v-model="selectedSrcLang" :options="languages" optionLabel="name" filter showClear />
                </div>
                <div class="t-ui-field">
                    <label>Дата</label>
                    <ComplexDatePicker v-model:date="date" v-model:date-value="dateValue" />
                </div>
            </div>

            <div class="t-ui-field">
                <label>Переводчики</label>
                <Persons v-model="translators" />
            </div>

            <div class="t-ui-field">
                <label>Жанры</label>
                <div class="t-ui-chipcontainer">
                    <Chip v-for="genre in selectedGenres" :key="genre.mark" :label="genre.name" removable
                        @remove="genreRemove(genre.mark)" />
                    <Button type="button" icon="pi pi-plus" @click="showGenreSelecter" v-tooltip="'Добавить'" />
                    <Popover ref="genrespop">
                        <Tree :value="genresTree" selectionMode="single" class="t-titleinfo-genrespop"
                            @node-select="genreSelect" />
                    </Popover>
                </div>
            </div>

            <div class="t-ui-field">
                <label>Ключевые слова</label>
                <InputText v-model.lazy=keywords />
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

import Persons from './Persons.vue';
import Editor from './Editor.vue';
import ComplexDatePicker from './ComplexDatePicker.vue';
import Sequences from './Sequences.vue';

import { Panel, Chip, Button, SelectButton, Popover, Select, FloatLabel, Tree, Image, InputText, InputNumber } from 'primevue';
import { TreeNode } from 'primevue/treenode';

import { Genre, genresTree, findGenre } from '../types/genres'
import { Language, languages, findLanguage } from '../types/languages';
import PersonInfo from '../types/personInfo';
import Series from '../types/series';
import { addingNodes, base64toData, parseDataURL } from '../utils';
import { fb2ns, xlinkns } from '../fb2Model';
import fileBroker from '../fileBroker';

interface StateDescription {
    bookTitle: string,
    date: string,
    dateValue: string,
    genresTree: TreeNode[],
    keywords: string,
    cover: string,
    coverType: string,
    languages: Language[],
    autors: PersonInfo[],
    translators: PersonInfo[],
    selectedLang: Language | undefined,
    selectedSrcLang: Language | undefined,
    selectedGenres: Genre[],
    sequences: Series[],
    isEmpty: boolean,
}

function initialStateDescription(): StateDescription {
    return {
        selectedGenres: [],
        selectedLang: undefined,
        selectedSrcLang: undefined,
        bookTitle: "",
        date: "",
        dateValue: "",
        autors: [],
        translators: [],
        genresTree: genresTree,
        keywords: "",
        cover: "",
        coverType: "",
        languages: languages,
        sequences: [],
        isEmpty: false
    };
};

export default defineComponent({
    name: "TitleInfo",
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
        Sequences,
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
    computed: {
        hasCover() {
            return this.cover !== "";
        },
        annotationId() {
            return this.$props.tag.startsWith("src") ? "src-annotation" : "annotation";
        },
        required() {
            return !this.$props.tag.startsWith("src");
        }
    },
    methods: {
        showGenreSelecter(event: Event) {
            (this.$refs.genrespop as InstanceType<typeof Popover>).toggle(event);
        },
        genreSelect(node: TreeNode) {
            if (!this.selectedGenres.find(g => g.mark === node.key) && node.label) {
                this.selectedGenres.push({ name: node.label, mark: node.key });
            };
        },
        genreRemove(mark: string) {
            this.selectedGenres = this.selectedGenres.filter(genre => genre.mark != mark)
        },
        parseContent(descElement: Element | undefined) {
            Object.assign(this.$data, initialStateDescription());

            if (!descElement) {
                this.isEmpty = !this.required;
                return;
            };

            const missingGenre = (badMark: string) => {
                this.$toast.add({ severity: 'warn', summary: 'Неизвестный жанр', detail: badMark, life: 5000 });
            };
            const missingLang = (badCode: string) => {
                this.$toast.add({ severity: 'warn', summary: 'Неизвестный язык', detail: badCode, life: 5000 });
            };

            for (const item of descElement.children) {
                if (item.tagName === "genre" && item.textContent) {
                    this.selectedGenres.push(findGenre(item.textContent, missingGenre));
                } else if (item.tagName === "author") {
                    this.autors.push(new PersonInfo(item));
                } else if (item.tagName === "book-title" && item.textContent) {
                    this.bookTitle = item.textContent;
                } else if (item.tagName === "keywords" && item.textContent) {
                    this.keywords = item.textContent;
                } else if (item.tagName === "date" && item.textContent) {
                    this.dateValue = item.getAttribute("value") ?? "";
                    this.date = item.textContent;
                } else if (item.tagName === "coverpage" && item.children) {
                    const image = item.children[0];
                    const href = image.getAttributeNS(xlinkns, "href")!;
                    const binary = item.ownerDocument.getElementById(href.slice(1));

                    if (binary) {
                        this.cover = "data:" + binary.getAttribute("content-type") + ";base64," + binary.textContent;
                        this.coverType = href.split('.').pop()!;
                    }
                } else if (item.tagName === "lang" && item.textContent) {
                    this.selectedLang = findLanguage(item.textContent, missingLang);
                } else if (item.tagName === "src-lang" && item.textContent) {
                    this.selectedSrcLang = findLanguage(item.textContent, missingLang);
                } else if (item.tagName === "translator") {
                    this.translators.push(new PersonInfo(item));
                } else if (item.tagName === "sequence") {
                    const name = item.getAttribute("name");
                    const number = item.getAttribute("number");
                    if (name) {
                        this.sequences.push(new Series(name, number));
                    };
                };
            };
        },
        serializeContent(xmlDoc: Document, titleInfo: Element) {
            const addElement = addingNodes(xmlDoc, fb2ns);

            const genres = this.selectedGenres.length ? this.selectedGenres : [{ mark: "" }];
            for (const element of genres) {
                addElement(titleInfo, "genre", element.mark, true);
            };

            const authors = this.autors.length ? this.autors : [new PersonInfo];
            for (const author of authors) {
                const authorNode = xmlDoc.createElementNS(fb2ns, "author");
                for (const prop of author.props()) {
                    addElement(authorNode, prop.key, prop.value, prop.required);
                };
                titleInfo.appendChild(authorNode);
            };

            addElement(titleInfo, "book-title", this.bookTitle, true);

            const [history] = titleInfo.getElementsByTagName("annotation");
            titleInfo.appendChild(history);

            addElement(titleInfo, "keywords", this.keywords);
            addElement(titleInfo, "date", this.date, false, [{ key: "value", value: this.dateValue || undefined }]);

            const cover = parseDataURL(this.cover);
            if (cover && cover.base64) {
                const id = (this.required ? "cover." : "src-cover.") + this.coverType;
                const attrs = [
                    { key: "id", value: id },
                    { key: "content-type", value: cover.mime },
                ]
                addElement(xmlDoc.getElementsByTagName("FictionBook")[0], "binary", cover.data, false, attrs);

                const coverpage = xmlDoc.createElementNS(fb2ns, "coverpage");
                const image = xmlDoc.createElementNS(fb2ns, "image");
                image.setAttributeNS(xlinkns, "href", "#" + id);

                coverpage.appendChild(image);
                titleInfo.appendChild(coverpage);
            };

            addElement(titleInfo, "lang", this.selectedLang?.code, true);
            addElement(titleInfo, "src-lang", this.selectedSrcLang?.code);

            for (const translator of this.translators) {
                const translatorNode = xmlDoc.createElementNS(fb2ns, "translator");
                for (const prop of translator.props()) {
                    addElement(translatorNode, prop.key, prop.value, prop.required);
                };
                titleInfo.appendChild(translatorNode);
            };

            for (const series of this.sequences) {
                if (series.name) {
                    const attrs = [
                        { key: "name", value: series.name },
                        { key: "number", value: series.number?.toString() },
                    ]
                    addElement(titleInfo, "sequence", "", true, attrs);
                };
            };

            const annotationEditor = this.$refs.annotationEditor as InstanceType<typeof Editor>;
            if (!titleInfo.textContent && !this.required && !annotationEditor.hasContent()) {
                titleInfo.remove();
            };
        },
        async selectCover() {
            const fileOptions: FilePickerOptions = {
                types: [{
                    description: "Изображения",
                    accept: {
                        "image/png": [".png", ".jpeg", ".jpg"],
                    }
                }],
                excludeAcceptAllOption: true
            };

            try {
                const [fileHandle] = await window.showOpenFilePicker(fileOptions);

                const file = await fileHandle.getFile();
                const reader = new FileReader();

                reader.readAsDataURL(file);
                reader.onerror = () => { throw reader.error; };
                reader.onload = () => {
                    this.cover = reader.result as string;
                    this.coverType = file.name.split('.').pop()!;
                };
            } catch (error) {
                if (!(error instanceof DOMException && error.name === 'AbortError')) {
                    this.$toast.add({ severity: 'error', summary: 'Ошибка открытия файла', detail: error, life: 10000 });
                };
            };
        },
        async saveCover() {
            const cover = parseDataURL(this.cover);
            if (cover && cover.base64) {
                const fileOptions: FilePickerOptions = {
                    types: [{
                        description: "Image",
                        accept: {
                            [cover.mime]: []
                        }
                    }],
                    // @ts-ignore
                    suggestedName: "cover",
                    excludeAcceptAllOption: true
                };

                try {
                    const fileHandle = await window.showSaveFilePicker(fileOptions);
                    const writableStream = await fileHandle.createWritable();

                    await writableStream.write(base64toData(cover.data));
                    await writableStream.close();
                } catch (error) {
                    if (!(error instanceof DOMException && error.name === 'AbortError')) {
                        this.$toast.add({ severity: 'error', summary: 'Ошибка сохранения файла', detail: error, life: 10000 });
                    };
                };
            };
        },
        deleteCover() {
            this.cover = "";
            this.coverType = "";
        }
    }
})
</script>

<style>
.t-titleinfo-nocover {
    border: 10px dashed;
    width: 200px;
    height: 200px;
    align-content: center;
    text-align: center;
    font-weight: bold;
}

.t-titleinfo-coverbuttons {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
}

.t-titleinfo-genrespop {
    display: flex;
    height: 25rem;
    padding: 0rem !important;
}
</style>