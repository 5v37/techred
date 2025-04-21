<template>
    <Toast />

    <MainToolbar @loaded="loaded = true" @reloaded="reloaded" />
    <ProsemirrorAdapterProvider>
        <Splitter v-if="loaded" layout="horizontal" class="t-app-main" style="border-radius: 0px">
            <SplitterPanel :size="15" :minSize="10" class="t-ui-container">
                <Tree :value="TOC" selectionMode="single" @node-select="onNodeSelect" class="t-app-toc" :pt="{
                    nodeContent: ({ context }) => ({
                        oncontextmenu: (event: Event) => onContextRightClick(event, context.node),
                        ondblclick: () => onDbClick(context.node),
                    }),
                    wrapper: { style: 'overflow-x: hidden' },
                    nodeIcon: { style: 'flex-shrink: 0' }
                }" />
            </SplitterPanel>
            <SplitterPanel :size="85">
                <div v-show="current === 'description'" ref="description" class="t-app-description">
                    <TitleInfo ref="titleInfo" header="Сведения" tag="title-info" />
                    <TitleInfo ref="srcTitleInfo" header="Сведения на оригинальном языке" tag="src-title-info" />
                    <DocumentInfo ref="documentInfo" header="Информация о файле" tag="document-info" />
                    <PublishInfo ref="publishInfo" header="Выходные данные" tag="publish-info" />
                    <CustomInfo ref="customInfo" header="Дополнительно" tag="custom-info" />
                </div>
                <Splitter v-show="current === 'content'" layout="vertical">
                    <SplitterPanel :size="75" :minSize="10" ref="body" style="overflow-y: auto;">
                        <Editor editor-id="body" />
                    </SplitterPanel>
                    <SplitterPanel :size="25" :minSize="10" ref="notes" style="overflow-y: auto;">
                        <Editor editor-id="notes" />
                    </SplitterPanel>
                </Splitter>
                <Images v-show="current === 'images'" />
            </SplitterPanel>
        </Splitter>
    </ProsemirrorAdapterProvider>

    <TreeContextMenu ref="treeContextMenu" />
</template>

<script lang="ts">
import { ComponentPublicInstance, defineComponent } from 'vue'

import { SplitterPanel, Splitter, Tree, Toast } from 'primevue';
import { TreeNode } from 'primevue/treenode';

import { ProsemirrorAdapterProvider } from '@prosemirror-adapter/vue';

import MainToolbar from './components/MainToolbar.vue';
import TitleInfo from './components/TitleInfo.vue';
import DocumentInfo from './components/DocumentInfo.vue';
import PublishInfo from './components/PublishInfo.vue';
import CustomInfo from './components/CustomInfo.vue';
import TreeContextMenu from './components/TreeContextMenu.vue';
import Editor from './components/Editor.vue';
import Images from './components/Images.vue';
import editorState from './editorState';

const TOCNodes = [
    {
        key: 'description',
        label: 'Описание',
        icon: 'pi pi-fw pi-hashtag',
        isRoot: true,
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
    },
    {
        key: 'body',
        label: 'Содержание',
        icon: 'pi pi-fw pi-book',
        isRoot: true,
        children: editorState.getTOC("body")
    },
    {
        key: 'notes',
        label: 'Примечания',
        icon: 'pi pi-fw pi-asterisk',
        isRoot: true,
        children: editorState.getTOC("notes")
    },
    {
        key: 'images',
        label: 'Изображения',
        icon: 'pi pi-fw pi-images',
        isRoot: true,
        children: []
    },
];

interface State {
    TOC: TreeNode[],
    loaded: boolean,
    toTopDescription: boolean,
    toTopContent: boolean,
    current: string
}

export default defineComponent({
    name: "App",
    components: {
        ProsemirrorAdapterProvider,
        MainToolbar,
        TitleInfo,
        DocumentInfo,
        PublishInfo,
        CustomInfo,
        Editor,
        Images,
        TreeContextMenu,
        Toast,
        Splitter,
        SplitterPanel,
        Tree
    },
    data(): State {
        return {
            current: "description",
            loaded: false,
            toTopDescription: false,
            toTopContent: false,
            TOC: TOCNodes,
        }
    },
    methods: {
        scrollToTop() {
            if (this.current === "description") {
                (this.$refs.description as Element).scrollTop = 0;
            } else if (this.current === "content") {
                (this.$refs.body as ComponentPublicInstance).$el.scrollTop = 0;
                (this.$refs.notes as ComponentPublicInstance).$el.scrollTop = 0;
            };
        },
        reloaded() {
            this.toTopDescription = this.current !== "description";
            this.toTopContent = this.current !== "content";
            this.scrollToTop();
        },
        onContextRightClick(event: Event, node: TreeNode) {
            (this.$refs.treeContextMenu as InstanceType<typeof TreeContextMenu>).show(event, node);
        },
        onDbClick(node: TreeNode) {
            if (node.key === "description") {
                (this.$refs.description as Element).scrollTop = 0;
            } else if (node.key === "body") {
                (this.$refs.body as ComponentPublicInstance).$el.scrollTop = 0;
            } else if (node.key === "notes") {
                (this.$refs.notes as ComponentPublicInstance).$el.scrollTop = 0;
            };
        },
        onNodeSelect(node: TreeNode) {
            let toTop = false;

            if (node.key === "images") {
                this.current = "images";
            } else if (node.key.startsWith("description")) {
                this.current = "description";
            } else {
                this.current = "content";
            }

            if (this.current === "description" && this.toTopDescription) {
                toTop = true;
                this.toTopDescription = false;
            } else if ((this.current === "content") && this.toTopContent) {
                toTop = true;
                this.toTopContent = false;
            }

            if (node.data && !node.isRoot) {
                queueMicrotask(() => {
                    const element = document.getElementById(node.data);
                    if (element) {
                        element.scrollIntoView();
                    };
                });
            } else if (toTop) {
                queueMicrotask(this.scrollToTop);
            };
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