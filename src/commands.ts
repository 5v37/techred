import { Attrs, Fragment, MarkType, Node, NodeType } from "prosemirror-model";
import { Command, Selection, AllSelection, NodeSelection, TextSelection, EditorState } from "prosemirror-state";
import { canSplit, findWrapping } from 'prosemirror-transform';

export function splitBlock(shift: boolean): Command {
    return (state, dispatch) => {
        let { $from } = state.selection;

        if (!$from.depth || state.selection instanceof NodeSelection) {
            return false;
        }

        const sectionType = state.schema.nodes.section;
        const parent = $from.parent;

        let types = [{ type: parent.type, attrs: {} }];
        let tr = state.tr;

        if (shift) {
            const { $to } = state.selection;
            const grandParent = $from.node($from.depth - 1);

            if (parent.childCount || $to.parent.childCount) {
                let startPoint = $from, endPoint = $to;
                const parentIndex = $from.index($from.depth - 1);
                if ($from.parentOffset === 0 && parentIndex > 0 && grandParent.children[parentIndex - 1].type === parent.type) {
                    startPoint = state.doc.resolve(startPoint.pos - 2);
                };

                const grandParentTo = $to.node($to.depth - 1);
                const parentToIndex = $to.index($to.depth - 1);
                if ($to.pos === $to.end() && parentToIndex < grandParentTo.childCount - 1
                    && grandParentTo.children[parentToIndex + 1].type === $to.parent.type) {
                    endPoint = state.doc.resolve(endPoint.pos + 2);
                };

                if (startPoint.pos !== $from.pos || endPoint.pos !== $to.pos) {
                    tr.setSelection(new TextSelection(startPoint, endPoint));
                    $from = tr.selection.$from;
                };
            };

            const type = grandParent.type;
            const attrs = type === sectionType ? { id: self.crypto.randomUUID() } : {};
            types.unshift({ type, attrs });
        };

        tr.deleteSelection();
        let splitPos = tr.mapping.map($from.pos);
        if (!canSplit(tr.doc, splitPos, types.length, types)) {
            return false;
        };
        if (dispatch) {
            tr.split(splitPos, types.length, types);

            if (shift) {
                if (!state.selection.empty) {
                    const selectedText = getTextFromSelection(state.selection, state.schema.nodes.p);
                    const title = state.schema.nodes.title.create(null, selectedText);
                    tr.insert(tr.selection.$from.start($from.depth - 1), title);
                };
            };

            dispatch(tr.scrollIntoView());
        };

        return true;
    };
};

export function updateMark(markType: MarkType, attrs: Attrs): Command {
    return (state, dispatch) => {
        const position = markPosition(state, state.selection.head, markType);
        if (position) {
            const { from, to, mark } = position;
            const tr = state.tr;

            tr.removeMark(from, to, mark);
            tr.addMark(from, to, markType.create(attrs));

            if (dispatch) {
                dispatch(tr);
            };

            return true;
        };

        return false;
    };
}

export function addTitle(): Command {
    return (state, dispatch) => {
        const { $from } = state.selection;

        if (!$from.depth || state.selection instanceof NodeSelection) {
            return false;
        };

        const parentNode = $from.node($from.depth - 1);
        const titleType = state.schema.nodes.title;

        if (!parentNode.canReplaceWith(0, 0, titleType)) {
            return false;
        };

        if (dispatch) {
            const insertPos = $from.start($from.depth - 1);
            const selectedText = getTextFromSelection(state.selection, state.schema.nodes.p);

            let tr = state.tr;
            if (state.selection instanceof TextSelection || state.selection instanceof AllSelection) {
                tr.deleteSelection();
            };
            let startPos = tr.mapping.map(insertPos);
            tr.insert(startPos, titleType.create(null, selectedText));

            // передвинуть курсор на заглавие ?

            dispatch(tr.scrollIntoView());
        };

        return true;
    };
};

export function addTextautor(): Command {
    return (state, dispatch) => {
        const { $from } = state.selection;

        if (!$from.depth || state.selection instanceof NodeSelection) {
            return false;
        };

        const parentNode = $from.node($from.depth - 1);
        const textauthorType = state.schema.nodes.textauthor;
        const lastIndex = parentNode.childCount;

        if (!parentNode.canReplaceWith(lastIndex, lastIndex, textauthorType)) {
            return false;
        };

        if (dispatch) {
            const insertPos = $from.end($from.depth - 1);
            const selectedText = getTextFromSelection(state.selection, textauthorType);

            let tr = state.tr;
            if (state.selection instanceof TextSelection || state.selection instanceof AllSelection) {
                tr.deleteSelection();
            };
            let startPos = tr.mapping.map(insertPos);
            tr.insert(startPos, selectedText);

            // передвинуть курсор ?

            dispatch(tr.scrollIntoView());
        };

        return true;
    };
};

export function wrapPoem(): Command {
    return (state, dispatch) => {
        const { $from, $to } = state.selection;

        if (!$from.depth || !$to.depth) {
            return false;
        };

        const parentNode = $from.node($from.depth - 1);
        if (!parentNode.eq($to.node($from.depth - 1))) {
            return false;
        }

        const poemType = state.schema.nodes.poem;

        if (!parentNode.canReplaceWith($from.index($from.depth - 1), $to.index($from.depth - 1), poemType)) {
            return false;
        };

        if (dispatch) {
            let tr = state.tr;

            tr.setSelection(new TextSelection(
                state.doc.resolve($from.before() + 1),
                state.doc.resolve($to.after() - 1)
            ));
            const selectedText = getTextFromSelection(tr.selection, state.schema.nodes.v);
            const stanzaType = state.schema.nodes.stanza;
            let poemNode: Node[] = [];
            let stanzaNode: Node[] = [];
            for (const element of selectedText) {
                if (element.textContent === "") {
                    if (stanzaNode.length) {
                        poemNode.push(stanzaType.create(null, stanzaNode));
                        stanzaNode = [];
                    }
                } else {
                    stanzaNode.push(element)
                };
            };
            poemNode.push(stanzaType.create(null, stanzaNode.length ? stanzaNode : selectedText));

            tr.replaceSelectionWith(poemType.create(null, poemNode));

            // передвинуть курсор ?

            dispatch(tr.scrollIntoView());
        };

        return true;
    };
};

export function changeToSection(): Command {
    return (state, dispatch) => {
        const { $from } = state.selection;

        if (!$from.depth) {
            return false;
        };

        const parentNode = $from.node($from.depth - 2);
        const sectionType = state.schema.nodes.section;
        const nodeIndex = $from.index($from.depth - 2);

        if (!parentNode.canReplaceWith(nodeIndex, nodeIndex + 1, sectionType) || parentNode.children[nodeIndex].type === sectionType) {
            return false;
        };

        if (dispatch) {
            let tr = state.tr;

            const section = sectionType.create({ id: self.crypto.randomUUID() }, parentNode.children[nodeIndex].children);
            tr.replaceWith($from.start($from.depth - 1) - 1, $from.end($from.depth - 1) + 1, section);

            dispatch(tr);
        };

        return true;
    };
};

function getTextFromSelection(selection: Selection, textType: NodeType) {
    const content = selection.content();
    if (content.size) {
        function getText(text: Fragment, parts: Node[]) {
            if (text.size) {
                let textNodes: Node[] = [];
                for (const node of text.content) {
                    if (node.isText) {
                        textNodes.push(node);
                    } else {
                        getText(node.content, parts)
                    };
                };
                if (textNodes.length) {
                    parts.push(textType.create(null, textNodes));
                };
            } else {
                parts.push(textType.create());
            };
        };

        let parts: Node[] = [];
        getText(content.content, parts);

        return parts;
    } else {
        return [textType.create()];
    };
};

function markPosition(state: EditorState, pos: number, markType: MarkType) {
    const $pos = state.doc.resolve(pos);

    const { parent, parentOffset } = $pos;
    const start = parent.childAfter(parentOffset);
    if (!start.node) return;

    const mark = start.node.marks.find((mark) => mark.type === markType);
    if (!mark) return;

    let startIndex = $pos.index();
    let from = $pos.start() + start.offset;
    let endIndex = startIndex + 1;
    let to = from + start.node.nodeSize;
    while (startIndex > 0 && mark.isInSet(parent.child(startIndex - 1).marks)) {
        startIndex -= 1;
        from -= parent.child(startIndex).nodeSize;
    }
    while (endIndex < parent.childCount && mark.isInSet(parent.child(endIndex).marks)) {
        to += parent.child(endIndex).nodeSize;
        endIndex += 1;
    }
    return { from, to, mark };
}

export function addInlineImage(image?: Node): Command {
    return (state, dispatch) => {
        const { $from } = state.selection;

        if (state.selection instanceof NodeSelection) {
            return false;
        };

        const currentIndex = $from.index();
        if (!$from.parent.canReplaceWith(currentIndex, currentIndex, state.schema.nodes.inlineimage)) {
            return false;
        };

        if (dispatch && image) {
            let tr = state.tr;
            if (state.selection instanceof TextSelection || state.selection instanceof AllSelection) {
                tr.deleteSelection();
            };
            let startPos = tr.mapping.map($from.pos);
            tr.insert(startPos, image);

            dispatch(tr.scrollIntoView());
        };

        return true;
    }
}

export function addNode(parentNode: Node, nodeType: NodeType, startPos: number, node?: Node): Command {
    return (state, dispatch) => {
        let pos = -1;
        let insertPos = startPos;
        for (let idx = 0; idx < parentNode.childCount; idx++) {
            if (parentNode.canReplaceWith(idx, idx, nodeType)) {
                pos = idx;
                break;
            };
            insertPos += parentNode.children[idx].nodeSize;
        };

        if (pos === -1) {
            return false;
        }

        if (dispatch) {
            let tr = state.tr;
            tr.insert(insertPos, node ?? nodeType.create(null, state.schema.nodes.p.create()));

            dispatch(tr.scrollIntoView());
        };

        return true;
    };
};


export function addNodeAfterSelection(nodeType: NodeType, node?: Node): Command {
    return (state, dispatch) => {
        const { $from, $to } = state.selection;

        if (!$from.depth) {
            return false;
        };

        const isNodeSelection = state.selection instanceof NodeSelection;
        const depth = isNodeSelection ? $from.depth : $from.depth - 1;

        const parentNode = $from.node(depth);
        const currentIndex = $from.index(depth);

        if (!parentNode.canReplaceWith(currentIndex, currentIndex, nodeType)) {
            return false;
        };

        if (dispatch) {
            const insertPos = isNodeSelection ? $to.pos : $from.end($from.depth) + 1;

            let tr = state.tr;
            tr.insert(insertPos, node ?? nodeType.create());

            dispatch(tr.scrollIntoView());
        };

        return true;
    };
};

export type SectionRange = {
    from: number,
    to: number,
    before: number,
    after: number,
    node: Node,
    nodeBefore?: Node,
    parent?: Node,
    parentStart: number,
    parentEnd: number
}

function sectionRangeByID(id: string, state: EditorState) {
    const sectionType = state.schema.nodes.section;
    function getSectionRange(id: string, root: readonly Node[], pos: number): SectionRange | undefined {
        let result: SectionRange | undefined = undefined;
        let nodeBefore: Node | undefined = undefined;
        for (const node of root) {
            if (result) {
                result.after += node.nodeSize;
                return result;
            };
            if (node.attrs.id && node.attrs.id === id) {
                result = {
                    from: pos,
                    to: pos + node.nodeSize,
                    before: nodeBefore ? pos - nodeBefore.nodeSize : pos,
                    after: pos + node.nodeSize,
                    node: node,
                    nodeBefore: nodeBefore,
                    parentStart: 0,
                    parentEnd: 0
                };
            } else if (node.type === sectionType) {
                if (node.childCount > 0) {
                    const target = getSectionRange(id, node.children, pos + 1);
                    if (target) {
                        if (!target.parent) {
                            target.parent = node;
                            target.parentStart = pos;
                            target.parentEnd = pos + node.nodeSize;
                        }
                        return target;
                    };
                };
                nodeBefore = node;
            };
            pos += node.nodeSize;
        };
        return result;
    };

    return getSectionRange(id, state.doc.children, 0);
}

function excludeSection(range?: SectionRange): Command {
    return (state, dispatch) => {
        if (!range || !range.parent) {
            return false;
        };

        if (dispatch) {
            let tr = state.tr;

            const cutNodes = range.parent.cut(range.from - range.parentStart);
            tr.insert(range.parentEnd, cutNodes.content);

            if (range.nodeBefore) {
                tr.delete(range.from, range.parentEnd);
            } else {
                tr.replaceWith(range.from, range.parentEnd, state.schema.node("p"));
            };

            dispatch(tr);
        };
        return true;
    };
};

function includeSection(range?: SectionRange): Command {
    return (state, dispatch) => {
        if (!range || !range.nodeBefore) {
            return false;
        };

        if (dispatch) {
            let tr = state.tr;

            tr.delete(range.from, range.to);

            const sectionType = state.schema.nodes.section;
            let startPoint = range.from - 1, endPoint = startPoint;
            let childCount = range.nodeBefore.childCount, childIndex = childCount;
            let hasContent = false;
            while (childIndex > 0 && !range.nodeBefore.canReplaceWith(childIndex, childCount, sectionType)) {
                childIndex -= 1;
                const child = range.nodeBefore.child(childIndex);
                startPoint -= child.nodeSize;
                hasContent = hasContent || child.textContent !== "";
            };

            if (startPoint === endPoint) {
                tr.insert(endPoint, range.node);
            } else {
                if (hasContent) {
                    const blockRange = state.doc.resolve(startPoint).blockRange(state.doc.resolve(endPoint));
                    const wrapping = blockRange && findWrapping(blockRange, sectionType, { id: self.crypto.randomUUID() });
                    if (wrapping) {
                        tr.wrap(blockRange, wrapping);
                        tr.insert(endPoint, range.node);
                    };
                } else {
                    tr.replaceWith(startPoint, endPoint, range.node);
                };
            };

            dispatch(tr);
        };
        return true;
    };
};

function joinSection(range?: SectionRange): Command {
    return (state, dispatch) => {
        const pType = state.schema.nodes.p;
        if (!range || !range.nodeBefore || range.nodeBefore.lastChild?.type !== pType) {
            return false;
        };

        const firstNode = range.node.firstChild!;
        const isTitleFirst = firstNode.type === state.schema.nodes.title && firstNode.childCount === 1
            && range.node.childCount > 1 && range.node.children[1].type === pType;
        if (firstNode.type !== pType && !isTitleFirst) {
            return false;
        };

        if (dispatch) {
            let tr = state.tr
            tr.delete(range.from, range.to);
            if (isTitleFirst) {
                const nodes = [];
                nodes.push(state.schema.nodes.subtitle.create(null, firstNode.firstChild?.children));
                for (let idx = 1; idx < range.node.childCount; idx++) {
                    nodes.push(range.node.children[idx]);
                }
                tr.insert(range.from - 2, nodes);
            } else {
                tr.insert(range.from - 2, range.node.children);
            }
            dispatch(tr);

        };
        return true;
    };
};

function moveUpSection(range?: SectionRange): Command {
    return (state, dispatch) => {
        if (!range || range.before >= range.from) {
            return false;
        }

        if (dispatch) {
            let tr = state.tr
            tr.delete(range.from, range.to);
            tr.insert(range.before, range.node);
            dispatch(tr);
        };
        return true;
    };
};

function moveDownSection(range?: SectionRange): Command {
    return (state, dispatch) => {
        if (!range || range.after <= range.to) {
            return false;
        }

        if (dispatch) {
            let tr = state.tr
            tr.insert(range.after, range.node);
            tr.delete(range.from, range.to);
            dispatch(tr);
        };
        return true;
    };
};

function deleteSection(range?: SectionRange): Command {
    return (state, dispatch) => {
        if (!range || !range.parent && range.from === range.before && range.to === range.after) {
            return false;
        }

        if (dispatch) {
            let tr = state.tr;
            if (range.from === range.before && range.to === range.after) {
                tr.replaceWith(range.from, range.to, state.schema.nodes.p.create());
            } else {
                tr.delete(range.from, range.to);
            };
            dispatch(tr);
        };
        return true;
    };
};

export { sectionRangeByID, excludeSection, includeSection, joinSection, moveUpSection, moveDownSection, deleteSection }