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

import fb2Mapper, { DocumentBlocks } from "@/modules/fb2Mapper";
import editorState from '@/modules/editorState';

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
    icon: 'pi pi-fw pi-pen-to-square',
    children: [
        {
            key: 'title-info',            
            label: 'Сведения',
            data: 'description',
            icon: 'pi pi-fw pi-list'
        },
        {
            key: 'src-title-info',
            label: 'Сведения на оригинальном языке',
            data: 'description',
            icon: 'pi pi-fw pi-list'
        },
        {
            key: 'document-info',
            label: 'Информация о файле',
            data: 'description',
            icon: 'pi pi-fw pi-list'
        },
        {
            key: 'publish-info',
            label: 'Выходные данные',
            data: 'description',
            icon: 'pi pi-fw pi-list'
        },
        {
            key: 'custom-info',
            label: 'Дополнительно',
            data: 'description',
            icon: 'pi pi-fw pi-list'
        }
    ]
});

fb2Mapper.addPreprocessor(getBlocks);

function getBlocks(xmlDoc: Document, method: string) {
    toTop = method === "parse";

    const [desc] = xmlDoc.getElementsByTagName("description");

    const parts: DocumentBlocks = {
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

defineExpose({ getBlocks });
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