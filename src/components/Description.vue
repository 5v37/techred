<template>
    <div ref="description" class="t-description-container">
        <TitleInfo ref="titleInfo" header="Сведения" tag="title-info" />
        <TitleInfo ref="srcTitleInfo" header="Сведения на оригинальном языке" tag="src-title-info" />
        <DocumentInfo ref="documentInfo" header="Информация о файле" tag="document-info" />
        <PublishInfo ref="publishInfo" header="Выходные данные" tag="publish-info" />
        <CustomInfo ref="customInfo" header="Дополнительно" tag="custom-info" />
    </div>
</template>

<script setup lang="ts">
import { onUpdated, useTemplateRef } from 'vue';

import TitleInfo from './TitleInfo.vue';
import DocumentInfo from './DocumentInfo.vue';
import PublishInfo from './PublishInfo.vue';
import CustomInfo from './CustomInfo.vue';

import fileBroker, { documentBlocks } from "../fileBroker";
import editorState from '../editorState';

let toTop = false;
const description = useTemplateRef('description');
onUpdated(() => {
    if (toTop && description.value && !description.value.style.display) {
        description.value.scrollTop = 0;
        toTop = false;
    }
});

editorState.menu.push({
    key: 'description',
    label: 'Описание',
    icon: 'pi pi-fw pi-hashtag',
    children: [
        {
            key: 'description-1',
            label: 'Сведения',
            data: 'title-info',
            icon: 'pi pi-fw pi-hashtag'
        },
        {
            key: 'description-2',
            label: 'Сведения на оригинальном языке',
            data: 'src-title-info',
            icon: 'pi pi-fw pi-hashtag'
        },
        {
            key: 'description-3',
            label: 'Информация о файле',
            data: 'document-info',
            icon: 'pi pi-fw pi-hashtag'
        },
        {
            key: 'description-4',
            label: 'Выходные данные',
            data: 'publish-info',
            icon: 'pi pi-fw pi-hashtag'
        },
        {
            key: 'description-5',
            label: 'Дополнительно',
            data: 'custom-info',
            icon: 'pi pi-fw pi-hashtag'
        }
    ]
});

fileBroker.addDescriber(getParts);

function getParts(xmlDoc: Document, method: string) {
    toTop = method === "parse";

    const [desc] = xmlDoc.getElementsByTagName("description");

    const parts: documentBlocks = {
        "title-info": undefined,
        "src-title-info": undefined,
        "document-info": undefined,
        "publish-info": undefined,
        "annotation": undefined,
        "src-annotation": undefined,
        "history": undefined,
        "description": desc,
    };

    if (desc) {
        for (const descElement of desc.children) {
            if (descElement.tagName in parts) {
                parts[descElement.tagName] = descElement;
                if (descElement.tagName === "title-info") {
                    [parts.annotation] = descElement.getElementsByTagName("annotation");
                } else if (descElement.tagName === "src-title-info") {
                    [parts["src-annotation"]] = descElement.getElementsByTagName("annotation");
                } else if (descElement.tagName === "document-info") {
                    [parts.history] = descElement.getElementsByTagName("history");
                }
            };
        };
    };

    return parts;
};

defineExpose({ getParts });
</script>

<style>
.t-description-container {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 0.75rem;
    gap: 0.75rem;
}
</style>