<template>
	<Panel toggleable :collapsed="!required">
		<template #header>
			<div :uid=tag class="t-ui-panelheader">{{ header }}</div>
		</template>

		<div class="t-ui-container">
			<div class="t-ui-field">
				<label>Заглавие</label>
				<InputText v-model.trim="model.bookTitle" />
			</div>

			<div class="t-ui-field">
				<label>Автор</label>
				<Persons v-model="model.authors" />
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
					<EmbeddedEditor ref="annotationEditor" :editor-id="annotationId" />
				</div>
			</div>

			<div class="t-ui-group">
				<div class="t-ui-field">
					<label>Язык</label>
					<Select v-model="model.selectedLang" :options="languages" optionLabel="name" filter showClear />
				</div>
				<div class="t-ui-field">
					<label>Язык оригинала</label>
					<Select v-model="model.selectedSrcLang" :options="languages" optionLabel="name" filter showClear />
				</div>
				<div class="t-ui-field">
					<label>Дата</label>
					<ComplexDatePicker v-model:date="model.date" v-model:date-value="model.dateValue" />
				</div>
			</div>

			<div class="t-ui-field">
				<label>Переводчики</label>
				<Persons v-model="model.translators" />
			</div>

			<div class="t-ui-field">
				<label>Жанры</label>
				<div class="t-ui-chipcontainer">
					<Chip v-for="genre in model.selectedGenres" :key="genre.mark" :label="genre.name" removable
						@remove="genreRemove(genre.mark)" />
					<Button type="button" icon="pi pi-plus" @click="showGenreSelector" v-tooltip="'Добавить'" />
					<Popover ref="genresPop" class="t-titleinfo-genrespop">
						<Tree :value="genresTree" selectionMode="single" :pt="{ root: { style: 'padding: 0rem' } }"
							@node-select="genreSelect" />
					</Popover>
				</div>
			</div>

			<div class="t-ui-field">
				<label>Ключевые слова</label>
				<InputText v-model.trim="model.keywords" />
			</div>

			<div class="t-ui-field">
				<label>Серии</label>
				<Sequences v-model="model.sequences" />
			</div>
		</div>
	</Panel>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";

import { Panel, Chip, Button, Popover, Select, Tree, Image, InputText } from "primevue";
import type { TreeNode } from "primevue/treenode";

import Persons from "@/components/Persons.vue";
import EmbeddedEditor from "@/components/EmbeddedEditor.vue";
import ComplexDatePicker from "@/components/ComplexDatePicker.vue";
import Sequences from "@/components/Sequences.vue";

import { openFileError, saveFileError, saveFileInfo } from "@/modules/notifications";
import { genresTree, findGenre } from "@/types/genres";
import type { Genre } from "@/types/genres";
import { languages, findLanguage } from "@/types/languages";
import type { Language } from "@/types/languages";
import PersonInfo from "@/types/personInfo";
import Series from "@/types/series";
import { openImageDialog, saveImageDialog } from "@/modules/fileAccess";
import { addingNodes } from "@/modules/utils";
import { fb2ns, xlinkns } from "@/modules/fb2Model";
import fb2Mapper from "@/modules/fb2Mapper";
import editorState from "@/modules/editorState";
import modificationTracker from "@/modules/modificationTracker";

const model = ref(initialStateDescription());
const genresPop = useTemplateRef<InstanceType<typeof Popover>>("genresPop");
const annotationEditor = useTemplateRef<InstanceType<typeof EmbeddedEditor>>("annotationEditor");
const props = defineProps<{
	tag: string
	header: string
}>();

const required = !props.tag.startsWith("src");
const annotationId = !required ? "src-annotation" : "annotation";

fb2Mapper.addProcessor(parseContent, serializeContent, props.tag);
modificationTracker.register(model);

const hasCover = computed(() => {
	return cover.value !== "";
});
const cover = computed(() => {
	return editorState.images.value.getDataByHref(model.value.coverHref);
});

function initialStateDescription() {
	return {
		selectedGenres: new Array<Genre>(),
		selectedLang: null as Language | null,
		selectedSrcLang: null as Language | null,
		bookTitle: "",
		date: "",
		dateValue: "",
		authors: new Array<PersonInfo>(),
		translators: new Array<PersonInfo>(),
		keywords: "",
		coverHref: "",
		sequences: new Array<Series>()
	};
};

function showGenreSelector(event: Event) {
	genresPop.value!.toggle(event);
}

function genreSelect(node: TreeNode) {
	if (!model.value.selectedGenres.find(g => g.mark === node.key) && node.label) {
		model.value.selectedGenres.push({ name: node.label, mark: node.key });
	};
}

function genreRemove(mark: string) {
	model.value.selectedGenres = model.value.selectedGenres.filter(genre => genre.mark != mark)
}

function parseContent(descElement: Element | undefined) {
	model.value = initialStateDescription();
	const data = model.value;

	if (!descElement) {
		return;
	};

	for (const item of descElement.children) {
		if (item.tagName === "genre" && item.textContent) {
			data.selectedGenres.push(findGenre(item.textContent));
		} else if (item.tagName === "author") {
			data.authors.push(new PersonInfo(item));
		} else if (item.tagName === "book-title" && item.textContent) {
			data.bookTitle = item.textContent.trim();
		} else if (item.tagName === "keywords" && item.textContent) {
			data.keywords = item.textContent.trim();
		} else if (item.tagName === "date" && item.textContent) {
			data.dateValue = item.getAttribute("value") ?? "";
			data.date = item.textContent.trim();
		} else if (item.tagName === "coverpage" && item.children) {
			data.coverHref = item.children[0].getAttributeNS(xlinkns, "href") ?? "";
		} else if (item.tagName === "lang" && item.textContent) {
			data.selectedLang = findLanguage(item.textContent);
		} else if (item.tagName === "src-lang" && item.textContent) {
			data.selectedSrcLang = findLanguage(item.textContent);
		} else if (item.tagName === "translator") {
			data.translators.push(new PersonInfo(item));
		} else if (item.tagName === "sequence") {
			const name = item.getAttribute("name")?.trim();
			const number = item.getAttribute("number");
			if (name) {
				data.sequences.push(new Series(name, number));
			};
		};
	};
}

function serializeContent(xmlDoc: Document, titleInfo: Element) {
	const data = model.value;
	const addElement = addingNodes(xmlDoc, fb2ns);

	const genres = data.selectedGenres.length ? data.selectedGenres : [{ mark: "" }];
	for (const element of genres) {
		addElement(titleInfo, "genre", element.mark, true);
	};

	const authors = data.authors.length ? data.authors : [new PersonInfo];
	for (const author of authors) {
		const authorNode = xmlDoc.createElementNS(fb2ns, "author");
		for (const prop of author.props()) {
			addElement(authorNode, prop.key, prop.value, prop.required);
		};
		titleInfo.appendChild(authorNode);
	};

	addElement(titleInfo, "book-title", data.bookTitle, true);

	const [history] = titleInfo.getElementsByTagName("annotation");
	titleInfo.appendChild(history);

	addElement(titleInfo, "keywords", data.keywords);
	addElement(titleInfo, "date", data.date, false, [{ key: "value", value: data.dateValue || undefined }]);

	if (hasCover.value) {
		const coverpage = xmlDoc.createElementNS(fb2ns, "coverpage");
		const image = xmlDoc.createElementNS(fb2ns, "image");
		image.setAttributeNS(xlinkns, "href", data.coverHref);

		coverpage.appendChild(image);
		titleInfo.appendChild(coverpage);
	};

	addElement(titleInfo, "lang", data.selectedLang?.code, true);
	addElement(titleInfo, "src-lang", data.selectedSrcLang?.code);

	for (const translator of data.translators) {
		const translatorNode = xmlDoc.createElementNS(fb2ns, "translator");
		for (const prop of translator.props()) {
			addElement(translatorNode, prop.key, prop.value, prop.required);
		};
		titleInfo.appendChild(translatorNode);
	};

	for (const series of data.sequences) {
		if (series.name) {
			const attrs = [
				{ key: "name", value: series.name },
				{ key: "number", value: series.number?.toString() },
			]
			addElement(titleInfo, "sequence", "", true, attrs);
		};
	};

	if (!titleInfo.textContent && !required && !annotationEditor.value!.hasContent()) {
		titleInfo.remove();
	};
}

function selectCover() {
	openImageDialog().then(file => {
		const id = editorState.images.value.addAsDataURL(file.name, file.content);
		if (id) {
			model.value.coverHref = "#" + id;
		};
	}).catch((error) => openFileError(error));
}

function saveCover() {
	if (hasCover.value && model.value.coverHref.startsWith("#")) {
		saveImageDialog(cover.value, model.value.coverHref.slice(1)).then(() => {
			saveFileInfo();
		}).catch((error) => saveFileError(error));
	};
}

function deleteCover() {
	model.value.coverHref = "";
}

defineExpose({ parseContent, serializeContent });
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