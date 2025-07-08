<template>
    <div :id="editorId" ref="editor" :spellcheck="spellcheckOn">
        <LinkEditor ref="linkEditor" />
    </div>
</template>

<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue'

import LinkEditor from "./LinkEditor.vue";
import ImageView from './ImageView.vue';

import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Node, DOMParser as pmDOMParser, DOMSerializer as pmDOMSerializer } from "prosemirror-model";
import { undo, redo, history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, toggleMark } from "prosemirror-commands";
import { menuBar } from "prosemirror-menu";
import { goToNextCell, tableEditing } from "prosemirror-tables";
import { dropCursor } from "prosemirror-dropcursor";

import type { TreeNode } from "primevue/treenode";
import { useNodeViewFactory } from '@prosemirror-adapter/vue';

import { annotationSchemaXML, annotationSchema, bodySchemaXML, bodySchema } from "../fb2Model";
import { buildMenuItems } from "../menu";
import { splitBlock } from "../commands";
import fileBroker from '../fileBroker';
import editorState from '../editorState';

const spellcheckOn = editorState.spellCheckOn;
const nodeViewFactory = useNodeViewFactory();
const linkEditor = useTemplateRef('linkEditor');
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
const emptyDoc = props.annotation ?
    schema.node("annotation", null, [schema.node("p")]) :
    schema.node("body", null, [schema.node("section", { id: self.crypto.randomUUID() }, [schema.node("p")])]);

let custKeymap = baseKeymap;
custKeymap["Enter"] = splitBlock(false);
custKeymap["Shift-Enter"] = splitBlock(true);

let view: EditorView;
let state: EditorState;
let root = emptyDoc;
if (!props.annotation) {
    updateTOC(root);
}

fileBroker.addSubscriber(parseContent, serializeContent, props.editorId);

onMounted(() => {
    state = EditorState.create({
        doc: root,
        plugins: [
            history(),
            keymap(custKeymap),
            keymap({
                "Mod-z": undo,
                "Mod-y": redo,
                "Ctrl-b": toggleMark(schema.marks.strong),
                "Ctrl-i": toggleMark(schema.marks.emphasis),
                "Ctrl-k": toggleMark(schema.marks.a),
                "Ctrl-,": toggleMark(schema.marks.sub),
                "Ctrl-.": toggleMark(schema.marks.sup),
                "Ctrl-Shift-x": toggleMark(schema.marks.strikethrough),
                "Ctrl-Shift-m": toggleMark(schema.marks.code),
                "Tab": goToNextCell(1),
                "Shift-Tab": goToNextCell(-1),
            }),
            tableEditing(),
            dropCursor(),
            menuBar({
                floating: !props.annotation,
                content: buildMenuItems(schema, linkEditor.value?.showEditLink)
            }),
        ]
    });
    view = new EditorView(editor.value, {
        state: state,
        nodeViews: {
            image: nodeViewFactory({
                component: ImageView,
                as: 'image'
            })
        },
        dispatchTransaction(transaction) {
            if (transaction.getMeta("updateTOC")) {
                updateTOC(transaction.doc);
            };
            let newState = view.state.apply(transaction)
            view.updateState(newState)
        }
    });
    editorState.setView(props.editorId, view);
});

function hasContent(): boolean {
    return view.state.doc.textContent !== "";
};
function parseContent(bodyElement: Element | undefined) {
    root = !bodyElement || !bodyElement.textContent ? emptyDoc : pmDOMParser.fromSchema(schema).parse(bodyElement);
    if (!props.annotation) {
        updateTOC(root);
    };
    if (view) {
        state.doc = root;
        view.updateState(state);
    };
};
function serializeContent(xmlDoc: Document, target: Element) {
    const schemaXML = props.annotation ? annotationSchemaXML : bodySchemaXML;
    if (props.editorId === "body0" || hasContent()) {
        pmDOMSerializer.fromSchema(schemaXML).serializeFragment(view.state.doc.content, { document: xmlDoc }, target as HTMLElement);
    } else {
        target.remove();
    }
};

function updateTOC(doc: Node) {
    function getTitle(node: Node) {
        for (let idx = 0; idx < 2 && idx < node.childCount; idx++) {
            if (node.children[idx].type.name == "title" ) {            
                let text: string[] = [];
                node.children[idx].content.forEach(p => {
                    if (p.textContent) {
                        text.push(p.textContent);
                    }
                });
                return text.join(" ");
            };
        };
    };
    function getTOC(keyName: string, Node: Node) {
        let TOC: TreeNode[] = [];
        let index = 0;
        Node.forEach(node => {
            if (node.attrs.id) {
                const titleName = getTitle(node) || "<section>";
                const key = keyName + '-' + index;
                const innerTOC = getTOC(key, node);
                const id = node.attrs.inid ? "#" + node.attrs.inid : undefined;
                TOC.push({ key: key, label: titleName, icon: 'pi pi-fw pi-bookmark', data: node.attrs.id, children: innerTOC, id: id });
                index++;
            };
        });
        return TOC;
    }

    editorState.bodies[props.editorId].toc.label = getTitle(doc) || editorState.bodies[props.editorId].name || "<body>";
    editorState.bodies[props.editorId].toc.icon = 'pi pi-fw pi-bookmark-fill';
    editorState.bodies[props.editorId].toc.children = getTOC(props.editorId, doc);
}
</script>

<style></style>