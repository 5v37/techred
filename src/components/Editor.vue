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
                "Ctrl-Shift-m": toggleMark(schema.marks.code)
            }),
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

<style lang="scss">
@mixin after($content: "<tag>") {
    content: $content;
    position: absolute;
    bottom: -8px;
    right: 5px;
    font-size: small;
    color: var(--p-text-muted-color);
    background: var(--p-content-background);
}

@mixin block($color: rgb(0, 0, 0)) {
    display: block;
    border: 1px solid $color;
    border-radius: 3px;
    padding: 6px;
    margin: 6px 0;
    position: relative;
}

.ProseMirror {
    section {
        @include block(rgb(221, 144, 0));
    }

    section::after {
        @include after($content: "<section>");
    }

    title {
        @include block(rgb(22, 231, 84));
        padding-block: 3px;
        margin-top: 0px;
        text-align: center;
    }

    title::after {
        @include after($content: "<title>");
    }

    epigraph {
        @include block(rgb(29, 78, 214));
    }

    epigraph::after {
        @include after($content: "<epigraph>");
    }

    text-author {
        @include block(rgb(29, 78, 214));
    }

    text-author::after {
        @include after($content: "<text-author>");
    }

    cite {
        @include block(rgb(211, 214, 29));
        font-style: normal;
    }

    cite::after {
        @include after($content: "<cite>");
    }

    poem {
        @include block(rgb(211, 214, 29));
    }

    poem::after {
        @include after($content: "<poem>");
    }

    stanza {
        @include block(rgb(211, 214, 29));
    }

    stanza::after {
        @include after($content: "<stanza>");
    }

    date {
        @include block(rgb(48, 29, 214));
    }

    date::after {
        @include after($content: "<date>");
    }

    annotation {
        @include block(rgb(230, 112, 220));
    }

    annotation::after {
        @include after($content: "<annotation>");
    }

    subtitle {
        @include block(rgb(68, 92, 68));
        text-align: center;
    }

    subtitle::after {
        @include after($content: "<subtitle>");
    }

    p,
    v {
        display: block;
        margin: 0em;
        text-indent: 1.4em;
    }

    a[type=note] {
        vertical-align: baseline;
        position: relative;
        top: -0.4em;
        font-size: smaller;
    }

    sup {
        vertical-align: baseline;
        position: relative;
        top: -0.4em;
        //line-height: 0;
    }

    sub {
        vertical-align: baseline;
        position: relative;
        bottom: -0.4em;
        //line-height: 0;
    }

    emphasis {
        font-style: italic;
        border: 1px solid rgb(255, 88, 88);
    }

    strikethrough {
        text-decoration: line-through;
    }
}
</style>