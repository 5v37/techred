import { AttributeSpec, Node, Schema } from "prosemirror-model";

export const fb2ns = "http://www.gribuser.ru/xml/fictionbook/2.0";
export const xlinkns = "http://www.w3.org/1999/xlink";

export const bodySchema = template("body", false);
export const bodySchemaXML = template("body", true);

export const annotationSchema = template("annotation", false);
export const annotationSchemaXML = template("annotation", true);

export const textBlocks = ["p", "v", "subtitle", "text-author"];
export const markBlocks = Object.keys(bodySchema.marks);

function template(topNode: string, toXML: boolean): Schema {
    const defaultNameSpace = toXML ? fb2ns + " " : "";
    const cellAttrs: Record<string, AttributeSpec> = {
        id: { default: null },
        colspan: { default: 1 },
        rowspan: { default: 1 },
        align: { default: null },
        valign: { default: null }
    };
    function getCellAttrs(dom: HTMLElement) {
        return {
            id: dom.getAttribute("id"),
            colspan: Number(dom.getAttribute('colspan') || 1),
            rowspan: Number(dom.getAttribute('rowspan') || 1),
            align: dom.getAttribute("align"),
            valign: dom.getAttribute("valign"),
        };
    };
    function setCellAttrs(node: Node) {
        return {
            id: node.attrs.id,
            colspan: node.attrs.colspan != 1 ? node.attrs.colspan : null,
            rowspan: node.attrs.rowspan != 1 ? node.attrs.rowspan : null,
            align: node.attrs.align,
            valign: node.attrs.valign,
        };
    };

    return new Schema({
        topNode: topNode,
        nodes: {
            body: { content: "image? title? epigraph* section+" },

            image: {
                inline: false,
                attrs: {
                    src: {},
                    // type: { default: null },
                    href: { default: null },
                    alt: { default: null },
                    title: { default: null },
                    id: { default: null }
                },
                draggable: true,
                parseDOM: [{
                    tag: "image", getAttrs(dom) {
                        const href = dom.getAttributeNS(xlinkns, "href")!;
                        const binary = dom.ownerDocument.getElementById(href.slice(1))!;
                        return {
                            src: "data:" + binary.getAttribute("content-type") + ";base64," + binary.textContent,
                            // type: dom.getAttributeNS(xlinkns, "type"),
                            href: href,
                            alt: dom.getAttribute("alt"),
                            title: dom.getAttribute("title"),
                            id: dom.getAttribute("id")
                        };
                    }
                }],
                toDOM(node) {
                    if (defaultNameSpace) {
                        return [defaultNameSpace + "image", {
                            // [xlinkns + " type"]: node.attrs.type,
                            [xlinkns + " href"]: node.attrs.href,
                            alt: node.attrs.alt,
                            title: node.attrs.title,
                            id: node.attrs.id,
                            src: node.attrs.src
                        }]
                    } else {
                        return ["image", node.attrs];
                    }
                }
            },
            title: {
                content: "p+",
                parseDOM: [{ tag: "title" }],
                toDOM() { return [defaultNameSpace + "title", 0] }
            },
            epigraph: {
                content: "(p+ | poem | cite)* textauthor*",
                attrs: {
                    id: { default: null }
                },
                parseDOM: [{
                    tag: "epigraph", getAttrs(dom) {
                        return { id: dom.getAttribute("id") };
                    }
                }],
                toDOM(node) { return [defaultNameSpace + "epigraph", node.attrs, 0] }
            },
            section: {
                content: "title? epigraph* image? annotation? (section+ | ((p | poem | subtitle | cite | table)? (p | image | poem | subtitle | cite | table)*))",
                attrs: {
                    id: { default: null },
                    inid: { default: null }
                },
                parseDOM: [{
                    tag: "section", getAttrs(dom) {
                        return {
                            id: self.crypto.randomUUID(),
                            inid: dom.getAttribute("id")
                        };
                    }
                }],
                //toDOM(node) { return [defaulNameSpace + "section", node.attrs, 0] }
                toDOM(node) {
                    if (defaultNameSpace) {
                        return [defaultNameSpace + "section", { id: node.attrs.inid }, 0];
                    } else {
                        return ["section", node.attrs, 0];
                    }
                }
            },

            p: {
                content: "(text | inlineimage)*",
                attrs: {
                    id: { default: null }
                },
                parseDOM: [
                    {
                        tag: "p", getAttrs(dom) {
                            return { id: dom.getAttribute("id") };
                        }
                    },
                    { tag: "empty-line" }
                ],
                toDOM(node) {
                    if (defaultNameSpace && !node.firstChild) {
                        return [defaultNameSpace + "empty-line", 0];
                    } else {
                        return [defaultNameSpace + "p", node.attrs, 0];
                    }
                }
            },
            textauthor: {
                content: "(text | inlineimage)*",
                parseDOM: [{ tag: "text-author" }],
                toDOM() { return [defaultNameSpace + "text-author", 0] }
            },
            poem: {
                content: "title? epigraph* (subtitle | stanza)+ textauthor* date?",
                attrs: {
                    id: { default: null }
                },
                parseDOM: [{
                    tag: "poem", getAttrs(dom) {
                        return { id: dom.getAttribute("id") };
                    }
                }],
                toDOM(node) { return [defaultNameSpace + "poem", node.attrs, 0] }
            },
            stanza: {
                content: "title? subtitle?  v+",
                parseDOM: [{ tag: "stanza" }],
                toDOM() { return [defaultNameSpace + "stanza", 0] }
            },
            v: {
                content: "(text | inlineimage)*",
                attrs: {
                    id: { default: null }
                },
                parseDOM: [{
                    tag: "v", getAttrs(dom) {
                        return { id: dom.getAttribute("id") };
                    }
                }],
                toDOM(node) { return [defaultNameSpace + "v", defaultNameSpace && !node.firstChild ? " " : 0] }
            },
            date: {
                attrs: {
                    value: { default: null }
                },
                content: "text*",
                marks: "",
                parseDOM: [{
                    tag: "date", getAttrs(dom) {
                        return { value: dom.getAttribute("value") };
                    }
                }],
                toDOM(node) { return [defaultNameSpace + "date", node.attrs, 0] }
            },
            cite: {
                content: "(p | poem | subtitle | table)* textauthor*",
                attrs: {
                    id: { default: null }
                },
                parseDOM: [{
                    tag: "cite", getAttrs(dom) {
                        return { id: dom.getAttribute("id") };
                    }
                }],
                toDOM(node) { return [defaultNameSpace + "cite", node.attrs, 0] }
            },
            subtitle: {
                content: "(text | inlineimage)*",
                attrs: {
                    id: { default: null }
                },
                parseDOM: [{
                    tag: "subtitle", getAttrs(dom) {
                        return { id: dom.getAttribute("id") };
                    }
                }],
                toDOM() { return [defaultNameSpace + "subtitle", 0] }
            },
            annotation: {
                attrs: {
                    id: { default: null }
                },
                content: "(p | poem | cite | subtitle | table)+",
                parseDOM: [{
                    tag: "annotation", getAttrs(dom) {
                        return { id: dom.getAttribute("id") };
                    }
                }],
                toDOM(node) { return [defaultNameSpace + "annotation", node.attrs, 0] }
            },
            table: {
                attrs: {
                    id: { default: null }
                },
                content: "tr+",
                tableRole: "table",
                isolating: true,
                parseDOM: [{
                    tag: "table", getAttrs(dom) {
                        return { id: dom.getAttribute("id") };
                    }
                }],
                toDOM(node) { return [defaultNameSpace + "table", node.attrs, 0] },
            },
            tr: {
                attrs: {
                    align: { default: null }
                },
                content: "(th | td)+",
                tableRole: "row",
                parseDOM: [{
                    tag: "tr", getAttrs(dom) {
                        return { align: dom.getAttribute("align") };
                    }
                }],
                toDOM(node) { return [defaultNameSpace + "tr", node.attrs, 0]; },
            },
            th: {
                content: "(text | inlineimage)*",
                attrs: cellAttrs,
                tableRole: "header_cell",
                isolating: true,
                parseDOM: [{ tag: "th", getAttrs: (dom) => getCellAttrs(dom) }],
                toDOM(node) { return [defaultNameSpace + "th", setCellAttrs(node), 0] },
            },
            td: {
                content: "(text | inlineimage)*",
                attrs: cellAttrs,
                tableRole: "cell",
                isolating: true,
                parseDOM: [{ tag: "td", getAttrs: (dom) => getCellAttrs(dom) }],
                toDOM(node) { return [defaultNameSpace + "td", setCellAttrs(node), 0] },
            },
            inlineimage: {
                inline: true,
                attrs: {
                    src: {},
                    // type: { default: null },
                    href: { default: null },
                    alt: { default: null }
                },
                parseDOM: [{
                    tag: "inlineimage", getAttrs(dom) {
                        const href = dom.getAttributeNS(xlinkns, "href")!;
                        const binary = dom.ownerDocument.getElementById(href.slice(1))!;
                        return {
                            src: "data:" + binary.getAttribute("content-type") + ";base64," + binary.textContent,
                            // type: dom.getAttributeNS(xlinkns, "type"),
                            href: href,
                            alt: dom.getAttribute("alt")
                        };
                    }
                }],
                toDOM(node) {
                    if (defaultNameSpace) {
                        return [defaultNameSpace + "image", {
                            // [xlinkns + " type"]: node.attrs.type,
                            [xlinkns + " href"]: node.attrs.href,
                            alt: node.attrs.alt,
                            src: node.attrs.src
                        }]
                    } else {
                        return ["img", node.attrs];
                    }
                }
            },
            text: { inline: true }
        },
        marks: {
            code: {
                parseDOM: [{ tag: "code" }],
                toDOM() { return [defaultNameSpace + "code"]; }
            },
            a: {
                attrs: {
                    // xtype: { default: null },
                    href: { default: null },
                    type: { default: null }
                },
                parseDOM: [{
                    tag: "a", getAttrs(dom) {
                        return {
                            // xtype: dom.getAttributeNS(xlinkns, "type"),
                            href: dom.getAttributeNS(xlinkns, "href"),
                            type: dom.getAttribute("type")
                        };
                    }
                }],
                toDOM(node) {
                    if (defaultNameSpace) {
                        return [defaultNameSpace + "a", {
                            // [xlinkns + " type"]: node.attrs.xtype,
                            [xlinkns + " href"]: node.attrs.href,
                            type: node.attrs.type
                        }]
                    } else {
                        return ["a", node.attrs];
                    }
                }
            },
            emphasis: {
                parseDOM: [{ tag: "emphasis" }],
                toDOM() { return [defaultNameSpace + "emphasis"]; }
            },
            strong: {
                parseDOM: [{ tag: "strong" }],
                toDOM() { return [defaultNameSpace + "strong"]; }
            },
            strikethrough: {
                parseDOM: [{ tag: "strikethrough" }],
                toDOM() { return [defaultNameSpace + "strikethrough"]; }
            },
            sup: {
                excludes: "sub",
                parseDOM: [{ tag: "sup" }],
                toDOM() { return [defaultNameSpace + "sup"]; }
            },
            sub: {
                excludes: "sup",
                parseDOM: [{ tag: "sub" }],
                toDOM() { return [defaultNameSpace + "sub"]; }
            }
        }
    })
};