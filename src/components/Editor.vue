<template>
    <div :id="editorId" ref="editor" :spellcheck="spellcheckOn"
        :class="{ 'highlight-emphasis': editorState.highlightEmphasisOn.value }">
    </div>
</template>

<script setup lang="ts">
import { useTemplateRef, onMounted, onUnmounted } from 'vue'

import ImageView from './views/ImageView.vue';
import InlineImageView from './views/InlineImageView.vue';
import BlockView from '../views/blockView';

import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Node, DOMParser as pmDOMParser, DOMSerializer as pmDOMSerializer } from "prosemirror-model";
import { DocAttrStep, ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";
import { undo, redo, history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, toggleMark, chainCommands } from "prosemirror-commands";
import { menuBar } from "prosemirror-menu";
import { goToNextCell, tableEditing } from "prosemirror-tables";
import { dropCursor } from "prosemirror-dropcursor";

import type { TreeNode } from "primevue/treenode";
import { useNodeViewFactory } from '@prosemirror-adapter/vue';

import { annotationSchemaXML, annotationSchema, bodySchemaXML, bodySchema } from "../fb2Model";
import { buildMenuItems } from "../menu";
import { setId, setLink, splitBlock } from "../commands";
import fb2Mapper from '../fb2Mapper';
import editorState from '../editorState';

const spellcheckOn = editorState.spellCheckOn;
const nodeViewFactory = useNodeViewFactory();
const props = defineProps<{
    editorId: string,
    annotation?: boolean
}>();
defineExpose({
    hasContent,
    parseContent,
    serializeContent
});

const editor = useTemplateRef('editor');
const schema = props.annotation ? annotationSchema : bodySchema;

let custKeymap = baseKeymap;
custKeymap["Enter"] = splitBlock(false);
custKeymap["Shift-Enter"] = splitBlock(true);

let view: EditorView;
let state: EditorState;
let root = emptyDoc();
if (!props.annotation) {
    updateTOC(root);
}

fb2Mapper.addProcessor(parseContent, serializeContent, props.editorId, 1);

onMounted(() => {
    state = EditorState.create({
        doc: root,
        plugins: [
            history(),
            keymap(custKeymap),
            keymap({
                "Mod-z": undo,
                "Mod-y": redo,
                "Mod-b": toggleMark(schema.marks.strong),
                "Mod-i": toggleMark(schema.marks.emphasis),
                "Mod-,": toggleMark(schema.marks.sub),
                "Mod-.": toggleMark(schema.marks.sup),
                "Mod-Shift-x": toggleMark(schema.marks.strikethrough),
                "Mod-Shift-m": toggleMark(schema.marks.code),
                "Mod-k": chainCommands(setLink(), () => true),
                "Mod-;": chainCommands(setId(false), () => true),
                "Mod-Shift-;": chainCommands(setId(true), () => true),
                "Tab": goToNextCell(1),
                "Shift-Tab": goToNextCell(-1),
            }),
            tableEditing(),
            dropCursor(),
            menuBar({
                floating: !props.annotation,
                content: buildMenuItems(schema)
            }),
        ]
    });
    view = new EditorView(editor.value, {
        state: state,
        handleScrollToSelection: () => {
            if (editorState.cancelEditorScroll) {
                editorState.cancelEditorScroll = false;
                return true;
            } else {
                return false;
            }
        },
        nodeViews: {
            image: nodeViewFactory({
                component: ImageView,
                as: 'image'
            }),
            inlineimage: nodeViewFactory({
                component: InlineImageView,
                as: 'inline-image'
            }),
            annotation: (node, view, getPos) => new BlockView(node, view, getPos),
            epigraph: (node, view, getPos) => new BlockView(node, view, getPos),
            section: (node, view, getPos) => new BlockView(node, view, getPos),
            poem: (node, view, getPos) => new BlockView(node, view, getPos),
            cite: (node, view, getPos) => new BlockView(node, view, getPos)
        },
        dispatchTransaction(transaction) {
            let newState = view.state.apply(transaction);
            view.updateState(newState);
            if (needUpdateTOC(transaction)) {
                updateTOC(view.state.doc);
            };
        }
    });
    editorState.views[props.editorId] = view;
});

onUnmounted(() => {
    fb2Mapper.delProcessor(props.editorId);
    delete editorState.views[props.editorId];
})

function hasContent(): boolean {
    return view.state.doc.textContent !== "";
}
function parseContent(bodyElement: Element | undefined) {
    const name = !props.annotation ? bodyElement?.getAttribute("name") || "" : undefined;
    root = !bodyElement || !bodyElement.textContent ? emptyDoc(name) : pmDOMParser.fromSchema(schema).parse(bodyElement, { topNode: emptyDoc(name) });
    if (!props.annotation) {
        updateTOC(root);
    };
    if (view) {
        state.doc = root;
        view.updateState(state);
    };
}
function serializeContent(xmlDoc: Document, target: Element) {
    const schemaXML = props.annotation ? annotationSchemaXML : bodySchemaXML;
    if (props.editorId === "body0" || hasContent()) {
        if (view.state.doc.attrs.name) {
            target.setAttribute("name", view.state.doc.attrs.name);
        };
        pmDOMSerializer.fromSchema(schemaXML).serializeFragment(view.state.doc.content, { document: xmlDoc }, target as HTMLElement);
    } else {
        target.remove();
    }
}

function emptyDoc(name?: string) {
    if (props.annotation) {
        return schema.node("annotation", null, [schema.node("p")]);
    } else {
        const attrs = name ? { name } : (props.editorId === "body1" ? { name: "notes" } : null);
        return schema.node("body", attrs, [schema.node("section", { uid: self.crypto.randomUUID() }, [schema.node("p")])]);
    };
}

function updateTOC(doc: Node) {
    function getTitle(node: Node) {
        for (let idx = 0; idx < 2 && idx < node.childCount; idx++) {
            if (node.children[idx].type.name == "title") {
                let text: string[] = [];
                node.children[idx].content.forEach(p => {
                    if (p.textContent) {
                        text.push(p.textContent);
                    }
                });
                return text.join(" ");
            };
        };
    }
    function getTOC(Node: Node) {
        let TOC: TreeNode[] = [];
        Node.forEach(node => {
            if (node.attrs.uid) {
                const titleName = getTitle(node) || "<section>";
                TOC.push({ key: node.attrs.uid, label: titleName, icon: 'pi pi-fw pi-bookmark', data: props.editorId, children: getTOC(node) });
            };
        });
        return TOC;
    }

    editorState.bodies[props.editorId].label = getTitle(doc) || doc.attrs.name || "<body>";
    editorState.bodies[props.editorId].icon = 'pi pi-fw pi-bookmark-fill';
    editorState.bodies[props.editorId].children = getTOC(doc);
}

function needUpdateTOC(transaction: Transaction) {
    if (transaction.docChanged) {
        let hasChange = false;
        for (const step of transaction.steps) {
            if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
                step.slice.content.forEach(node => {
                    if (node.attrs.uid || node.type === schema.nodes.title && node.textContent !== "") {
                        hasChange = true;
                        return;
                    };
                });
                if (!hasChange && step.slice.size === 0) {
                    transaction.before.slice(step.from, step.to).content.forEach(node => {
                        if (node.attrs.uid || node.type === schema.nodes.title && node.textContent !== "") {
                            hasChange = true;
                            return;
                        }
                    });
                };
                if (!hasChange) {
                    const pos = transaction.doc.resolve(step.from);
                    if (pos.depth > 1 && pos.node(pos.depth - 1).type === schema.nodes.title) {
                        let parentType = pos.node(pos.depth - 2).type;
                        hasChange = parentType === schema.nodes.section || parentType === schema.nodes.body;
                    };
                };

                if (hasChange) {
                    return true;
                };
            } else if (step instanceof DocAttrStep && step.attr === "name") {
                return true;
            }
        };
    };
    return false;
}
</script>

<style></style>