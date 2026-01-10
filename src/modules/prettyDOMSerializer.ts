import { DOMSerializer, Fragment, Mark, Schema, Node as PMNode } from "prosemirror-model";

// Приватные методы ProseMirror, недоступные в публичном API, но используемые в исходниках
declare module "prosemirror-model" {
    interface DOMSerializer {
        serializeMark(mark: Mark, inline: boolean, options?: { document?: Document }): {
            dom: HTMLElement;
            contentDOM?: HTMLElement;
        };
        serializeNodeInner(node: PMNode, options: { document?: Document }): Node;
    }
}

function doc(options?: { document?: Document }): Document {
    return options?.document || document;
}

function reorderMarks(marks: readonly Mark[], active: [Mark, HTMLElement | DocumentFragment][]) {
    if (active.length && marks.length > 1) {
        const result: Mark[] = new Array(marks.length);
        const common: boolean[] = new Array(marks.length);

        let front = 0;
        for (let i = 0; i < active.length; i++) {
            for (let j = 0; j < marks.length; j++) {
                if (marks[j].eq(active[i][0])) {
                    result[front++] = marks[j];
                    common[j] = true;
                    break;
                };
            };
        };

        for (let i = 0; i < common.length; i++) {
            if (!common[i]) {
                result[front++] = marks[i];
            };
        };

        return result;
    };

    return marks;
}

class PrettyDOMSerializer extends DOMSerializer {
    serializeFragment(fragment: Fragment, options: { document?: Document } = {}, target?: HTMLElement | DocumentFragment): HTMLElement | DocumentFragment {
        if (!target) target = doc(options).createDocumentFragment();

        let top = target!;
        const active: [Mark, HTMLElement | DocumentFragment][] = [];

        fragment.forEach(node => {
            const nodeMarks = reorderMarks(node.marks, active);

            if (active.length || nodeMarks.length) {
                let keep = 0, rendered = 0;
                while (keep < active.length && rendered < nodeMarks.length) {
                    const next = nodeMarks[rendered];
                    if (!this.marks[next.type.name]) { rendered++; continue };
                    if (!next.eq(active[keep][0]) || next.type.spec.spanning === false) break;
                    keep++; rendered++;
                };
                while (keep < active.length) top = active.pop()![1];
                while (rendered < nodeMarks.length) {
                    const add = nodeMarks[rendered++];
                    const markDOM = this.serializeMark(add, node.isInline, options);
                    if (markDOM) {
                        active.push([add, top]);
                        top.appendChild(markDOM.dom);
                        top = markDOM.contentDOM || markDOM.dom as HTMLElement;
                    };
                };
            };
            top.appendChild(this.serializeNodeInner(node, options));
        });

        return target;
    }

    static fromSchema(schema: Schema): PrettyDOMSerializer {
        return schema.cached.domSerializer as PrettyDOMSerializer ||
            (schema.cached.domSerializer = new PrettyDOMSerializer(this.nodesFromSchema(schema), this.marksFromSchema(schema)));
    }
}

export default PrettyDOMSerializer;