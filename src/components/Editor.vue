<template>
    <div :id="editorId" ref="editor" spellcheck="false">
        <LinkEditor ref="linkEditor" />
    </div>
</template>

<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue'

import LinkEditor from "./LinkEditor.vue";

import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Node, DOMParser as pmDOMParser, DOMSerializer as pmDOMSerializer } from "prosemirror-model";
import { undo, redo, history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, toggleMark } from "prosemirror-commands";
import { menuBar } from "prosemirror-menu";
import { goToNextCell, tableEditing } from "prosemirror-tables";

import type { TreeNode } from "primevue/treenode";

import { annotationSchemaXML, annotationSchema, bodySchemaXML, bodySchema } from "../fb2Model";
import { buildMenuItems } from "../menu";
import { splitBlock } from "../commands";
import fileBroker from '../fileBroker';
import editorState from '../editorState';

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
            menuBar({
                floating: !props.annotation,
                content: buildMenuItems(schema, linkEditor.value?.showEditLink)
            }),
        ]
    });
    view = new EditorView(editor.value, {
        state: state,
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
    if (props.editorId === "body" || hasContent()) {
        pmDOMSerializer.fromSchema(schemaXML).serializeFragment(view.state.doc.content, { document: xmlDoc }, target as HTMLElement);
    } else {
        target.remove();
    }
};

function updateTOC(doc: Node) {
    function getTOC(keyName: string, Node: Node) {
        let TOC: TreeNode[] = [];
        let index = 0;
        Node.forEach(node => {
            if (node.attrs.id) {
                let titleName = "<section>";
                const title = node.firstChild;

                if (title && title.type.name == 'title') {
                    let text: string[] = [];
                    title.content.forEach(p => {
                        if (p.firstChild?.text) {
                            text.push(p.firstChild.text);
                        }
                    });
                    titleName = text.join(' ');
                };
                const key = keyName + '-' + index;
                const innerTOC = getTOC(key, node);
                const id = node.attrs.inid ? "#" + node.attrs.inid : undefined;
                TOC.push({ key: key, label: titleName, icon: 'pi pi-fw pi-bookmark', data: node.attrs.id, children: innerTOC, id: id });
                index++;
            };
        });
        return TOC;
    }

    editorState.setTOC(props.editorId, getTOC(props.editorId, doc));
}
</script>

<style></style>