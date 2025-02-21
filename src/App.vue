<template>
    <Toast />

    <MainToolbar @loaded="loaded = true" />
    <Splitter v-if="loaded" layout="horizontal" class="t-app-main" style="border-radius: 0px">
        <SplitterPanel :size="15" :minSize="10" class="t-ui-container">
            <Tree :value="TOC" selectionMode="single" @node-select="onNodeSelect" class="t-app-toc" :pt="{
                nodeContent: ({ context }) => ({
                    oncontextmenu: (event: Event) => onContextRightClick(event, context.node)
                }),
                wrapper: { style: 'overflow-x: hidden' },
                nodeIcon: { style: 'flex-shrink: 0' }
            }" />
        </SplitterPanel>
        <SplitterPanel :size="85">
            <div v-show="showDescription" id="description" class="t-app-description">
                <TitleInfo ref="titleInfo" header="Сведения" tag="title-info" />
                <TitleInfo ref="srcTitleInfo" header="Сведения на оригинальном языке" tag="src-title-info" />
                <DocumentInfo ref="documentInfo" header="Информация о файле" tag="document-info" />
                <PublishInfo ref="publishInfo" header="Выходные данные" tag="publish-info" />
                <CustomInfo ref="customInfo" header="Дополнительно" tag="custom-info" />
            </div>
            <Splitter v-show="!showDescription" layout="vertical">
                <SplitterPanel :size="75" :minSize="10" style="overflow-y: auto;">
                    <Editor ref="bodyEditor" editor-id="body" />
                </SplitterPanel>
                <SplitterPanel :size="25" :minSize="10" style="overflow-y: auto;">
                    <Editor ref="notesEditor" editor-id="notes" />
                </SplitterPanel>
            </Splitter>
        </SplitterPanel>
    </Splitter>

    <TreeContextMenu ref="treeContextMenu" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { SplitterPanel, Splitter, Tree, Toast } from 'primevue';
import { TreeNode } from 'primevue/treenode';

import MainToolbar from './components/MainToolbar.vue';
import TitleInfo from './components/TitleInfo.vue';
import DocumentInfo from './components/DocumentInfo.vue';
import PublishInfo from './components/PublishInfo.vue';
import CustomInfo from './components/CustomInfo.vue';
import TreeContextMenu from './components/TreeContextMenu.vue';
import Editor from './components/Editor.vue';
import editorState from './editorState';

const TOCNodes = [
    {
        key: '0',
        label: 'Описание',
        data: 'description',
        icon: 'pi pi-fw pi-hashtag',
        children: [
            {
                key: '0-1',
                label: 'Сведения',
                data: 'title-info',
                icon: 'pi pi-fw pi-hashtag'
            },
            {
                key: '0-2',
                label: 'Сведения на оригинальном языке',
                data: 'src-title-info',
                icon: 'pi pi-fw pi-hashtag'
            },
            {
                key: '0-3',
                label: 'Информация о файле',
                data: 'document-info',
                icon: 'pi pi-fw pi-hashtag'
            },
            {
                key: '0-4',
                label: 'Выходные данные',
                data: 'publish-info',
                icon: 'pi pi-fw pi-hashtag'
            },
            {
                key: '0-5',
                label: 'Дополнительно',
                data: 'custom-info',
                icon: 'pi pi-fw pi-hashtag'
            }
        ]
    },
    {
        key: '1',
        label: 'Содержание',
        data: 'body',
        icon: 'pi pi-fw pi-book',
        children: editorState.getTOC("body")
    },
    {
        key: '2',
        label: 'Примечания',
        data: 'notes',
        icon: 'pi pi-fw pi-asterisk',
        children: editorState.getTOC("notes")
    }
];

interface State {
    TOC: TreeNode[],
    loaded: boolean,
    showDescription: boolean
}

export default defineComponent({
    name: "App",
    components: {
        MainToolbar,
        TitleInfo,
        DocumentInfo,
        PublishInfo,
        CustomInfo,
        Editor,
        TreeContextMenu,
        Toast,
        Splitter,
        SplitterPanel,
        Tree
    },
    data(): State {
        return {
            showDescription: true,
            loaded: false,
            TOC: TOCNodes,
        }
    },
    methods: {
        onContextRightClick(event: Event, node: TreeNode) {
            (this.$refs.treeContextMenu as InstanceType<typeof TreeContextMenu>).show(event, node);
        },
        onNodeSelect(node: TreeNode) {
            this.showDescription = node.key.startsWith("0");
            if (node.data) {
                queueMicrotask(() => {
                    const element = document.getElementById(node.data);
                    if (element) {
                        element.scrollIntoView();
                    };
                });
            }
        }
    }
})
</script>

<style>
.t-app-main {
    flex: 1 1 0;
    overflow: hidden;
}

.t-app-description {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 0.75rem;
    gap: 0.75rem;
}

.t-app-toc {
    flex: 1 1 auto;
    overflow-y: auto;
}
</style>