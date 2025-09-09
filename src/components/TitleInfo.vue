<template>
    <Panel toggleable :collapsed="isEmpty">
        <template #header>
            <div :id=tag class="t-ui-panelheader">{{ header }}</div>
        </template>

        <div class="t-ui-container">
            <div class="t-ui-field">
                <label>Заглавие</label>
                <InputText v-model.lazy.trim=bookTitle />
            </div>

            <div class="t-ui-field">
                <label>Автор</label>
                <Persons v-model="authors" />
            </div>

            <div class="t-ui-group">
                <div class="t-ui-field t-ui-grow0">
                    <label>Обложка</label>
                    <div class="t-ui-group">
                        <div v-show="!hasCover" class="t-titleinfo-nocover">ОТСУТСТВУЕТ</div>
                        <Image v-show="hasCover" :src="cover" alt="Обложка" preview width="200"
                            :pt="{ image: { style: 'object-fit: contain' } }" style="min-height: 150px;" />
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
                    <Button type="button" icon="pi pi-plus" @click="showGenreSelector" v-tooltip="'Добавить'" />
                    <Popover ref="genrespop" class="t-titleinfo-genrespop">
                        <Tree :value="genresTree" selectionMode="single" :pt="{ root: { style: 'padding: 0rem' } }"
                            @node-select="genreSelect" />
                    </Popover>
                </div>
            </div>

            <div class="t-ui-field">
                <label>Ключевые слова</label>
                <InputText v-model.lazy.trim=keywords />
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

import { openFileError, saveFileError, saveFileInfo } from '../notification';
import { Genre, genresTree, findGenre } from '../types/genres'
import { Language, languages, findLanguage } from '../types/languages';
import PersonInfo from '../types/personInfo';
import Series from '../types/series';
import { openImageDialog, saveImageDialog } from '../fileAccess';
import { addingNodes } from '../utils';
import { fb2ns, xlinkns } from '../fb2Model';
import fileBroker from '../fileBroker';
import editorState from '../editorState';

interface StateDescription {
    bookTitle: string,
    date: string,
    dateValue: string,
    genresTree: TreeNode[],
    keywords: string,
    coverHref: string,
    languages: Language[],
    authors: PersonInfo[],
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
        authors: [],
        translators: [],
        genresTree: genresTree,
        keywords: "",
        coverHref: "",
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
        },
        cover() {
            return editorState.images.value.getDataByHref(this.coverHref);
        }
    },
    methods: {
        showGenreSelector(event: Event) {
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

            for (const item of descElement.children) {
                if (item.tagName === "genre" && item.textContent) {
                    this.selectedGenres.push(findGenre(item.textContent));
                } else if (item.tagName === "author") {
                    this.authors.push(new PersonInfo(item));
                } else if (item.tagName === "book-title" && item.textContent) {
                    this.bookTitle = item.textContent.trim();
                } else if (item.tagName === "keywords" && item.textContent) {
                    this.keywords = item.textContent.trim();
                } else if (item.tagName === "date" && item.textContent) {
                    this.dateValue = item.getAttribute("value") ?? "";
                    this.date = item.textContent.trim();
                } else if (item.tagName === "coverpage" && item.children) {
                    this.coverHref = item.children[0].getAttributeNS(xlinkns, "href") ?? "";
                } else if (item.tagName === "lang" && item.textContent) {
                    this.selectedLang = findLanguage(item.textContent);
                } else if (item.tagName === "src-lang" && item.textContent) {
                    this.selectedSrcLang = findLanguage(item.textContent);
                } else if (item.tagName === "translator") {
                    this.translators.push(new PersonInfo(item));
                } else if (item.tagName === "sequence") {
                    const name = item.getAttribute("name")?.trim();
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

            const authors = this.authors.length ? this.authors : [new PersonInfo];
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

            if (this.hasCover) {
                const coverpage = xmlDoc.createElementNS(fb2ns, "coverpage");
                const image = xmlDoc.createElementNS(fb2ns, "image");
                image.setAttributeNS(xlinkns, "href", this.coverHref);

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
        selectCover() {
            openImageDialog().then(file => {
                const id = editorState.images.value.addAsDataURL(file.name, file.content);
                if (id) {
                    this.coverHref = "#" + id;
                };
            }).catch((error) => openFileError(error));
        },
        saveCover() {
            if (this.hasCover && this.coverHref.startsWith("#")) {
                saveImageDialog(this.cover, this.coverHref.slice(1)).then(() => {
                    saveFileInfo()
                }).catch((error) => saveFileError(error));
            };
        },
        deleteCover() {
            this.coverHref = "";
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
    height: 25rem;
    overflow: auto;
}
</style>