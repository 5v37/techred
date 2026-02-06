import { AttributeSpec, Node, Schema } from "prosemirror-model";
import imageStore from "@/modules/imageStore";

const xmlTemplate =
	`<?xml version="1.0" encoding="UTF-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">
 <description>
  <title-info><annotation/></title-info>
  <src-title-info><annotation/></src-title-info>
  <document-info><history/></document-info>
  <publish-info/>
 </description>
</FictionBook>`;

const fb2ns = "http://www.gribuser.ru/xml/fictionbook/2.0";
const xlinkns = "http://www.w3.org/1999/xlink";
const textBlocks = ["p", "v", "th", "td", "subtitle", "text-author"];
const inlineImageSelector = ":is(" + textBlocks.join(",") + ") > image";

function getCellAttrs(dom: HTMLElement) {
	return {
		id: dom.getAttribute("id"),
		colspan: Number(dom.getAttribute("colspan") || 1),
		rowspan: Number(dom.getAttribute("rowspan") || 1),
		align: dom.getAttribute("align"),
		valign: dom.getAttribute("valign")
	};
};

function setCellAttrs(node: Node) {
	return {
		id: node.attrs.id,
		colspan: node.attrs.colspan !== 1 ? node.attrs.colspan : null,
		rowspan: node.attrs.rowspan !== 1 ? node.attrs.rowspan : null,
		align: node.attrs.align,
		valign: node.attrs.valign
	};
};

function template(topNode: string, toXML: boolean): Schema {
	const defaultNameSpace = toXML ? fb2ns + " " : "";
	const cellAttrs: Record<string, AttributeSpec> = {
		id: { default: null },
		colspan: { default: 1 },
		rowspan: { default: 1 },
		align: { default: null },
		valign: { default: null }
	};

	return new Schema({
		topNode: topNode,
		nodes: {
			body: {
				attrs: {
					name: { default: null },
					body: { default: null }
				},
				content: "image? title? epigraph* section+"
			},

			image: {
				inline: false,
				attrs: {
					imgid: { default: null },
					alt: { default: null },
					title: { default: null },
					id: { default: null }
				},
				draggable: true,
				parseDOM: [{
					tag: `image:not(${inlineImageSelector})`,
					getAttrs(dom) {
						return {
							imgid: imageStore.getImgid(dom.getAttributeNS(xlinkns, "href")),
							alt: dom.getAttribute("alt"),
							title: dom.getAttribute("title"),
							id: dom.getAttribute("id")
						};
					}
				}, {
					tag: "figure",
					getAttrs(dom) {
						return {
							imgid: dom.getAttribute("imgid"),
							alt: dom.getAttribute("alt"),
							title: dom.getAttribute("title"),
							id: dom.getAttribute("id")
						};
					}
				}],
				leafText: () => "◪",
				toDOM(node) {
					if (defaultNameSpace) {
						return [defaultNameSpace + "image", {
							[xlinkns + " href"]: imageStore.getHref(node.attrs.imgid),
							alt: node.attrs.alt,
							title: node.attrs.title,
							id: node.attrs.id
						}];
					} else {
						return ["figure", node.attrs];
					}
				}
			},
			title: {
				content: "p+",
				parseDOM: [{ tag: "title, header" }],
				toDOM() {
					if (defaultNameSpace) {
						return [defaultNameSpace + "title", 0];
					} else {
						return ["header", 0];
					}
				}
			},
			epigraph: {
				content: "(p+ | poem | cite)* textauthor*",
				attrs: {
					id: { default: null }
				},
				parseDOM: [{
					tag: "epigraph",
					getAttrs(dom) {
						return { id: dom.getAttribute("id") };
					}
				}],
				toDOM(node) { return [defaultNameSpace + "epigraph", node.attrs, 0] }
			},
			section: {
				content: "title? epigraph* image? annotation? (section+ | ((p | poem | subtitle | cite | table)? (p | image | poem | subtitle | cite | table)*))",
				attrs: {
					id: { default: null },
					uid: { default: null }
				},
				parseDOM: [{
					tag: "section",
					getAttrs(dom) {
						return {
							id: dom.getAttribute("id"),
							uid: self.crypto.randomUUID()
						};
					}
				}],
				toDOM(node) {
					if (defaultNameSpace) {
						return [defaultNameSpace + "section", { id: node.attrs.id }, 0];
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
						tag: "p",
						getAttrs(dom) {
							return { id: dom.getAttribute("id") };
						}
					},
					{ tag: "empty-line" }
				],
				toDOM(node) {
					if (defaultNameSpace && node.textContent.trim() === "") {
						return [defaultNameSpace + "empty-line"];
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
					tag: "poem",
					getAttrs(dom) {
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
					tag: "v",
					getAttrs(dom) {
						return { id: dom.getAttribute("id") };
					}
				}],
				toDOM(node) { return [defaultNameSpace + "v", node.attrs, defaultNameSpace && !node.firstChild ? " " : 0] }
			},
			date: {
				attrs: {
					value: { default: null }
				},
				content: "text*",
				marks: "",
				parseDOM: [{
					tag: "date",
					getAttrs(dom) {
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
					tag: "cite",
					getAttrs(dom) {
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
					tag: "subtitle",
					getAttrs(dom) {
						return { id: dom.getAttribute("id") };
					}
				}],
				toDOM(node) { return [defaultNameSpace + "subtitle", node.attrs, 0] }
			},
			annotation: {
				content: "(p | poem | cite | subtitle | table)+",
				attrs: {
					id: { default: null }
				},
				parseDOM: [{
					tag: "annotation",
					getAttrs(dom) {
						return { id: dom.getAttribute("id") };
					}
				}],
				toDOM(node) { return [defaultNameSpace + "annotation", node.attrs, 0] }
			},
			table: {
				content: "tr+",
				attrs: {
					id: { default: null }
				},
				tableRole: "table",
				isolating: true,
				parseDOM: [{
					tag: "table",
					getAttrs(dom) {
						return { id: dom.getAttribute("id") };
					}
				}],
				toDOM(node) { return [defaultNameSpace + "table", node.attrs, 0] }
			},
			tr: {
				content: "(th | td)+",
				attrs: {
					align: { default: null }
				},
				tableRole: "row",
				parseDOM: [{
					tag: "tr",
					getAttrs(dom) {
						return { align: dom.getAttribute("align") };
					}
				}],
				toDOM(node) { return [defaultNameSpace + "tr", node.attrs, 0] }
			},
			th: {
				content: "(text | inlineimage)*",
				attrs: cellAttrs,
				tableRole: "header_cell",
				isolating: true,
				parseDOM: [{ tag: "th", getAttrs: (dom) => getCellAttrs(dom) }],
				toDOM(node) { return [defaultNameSpace + "th", setCellAttrs(node), 0] }
			},
			td: {
				content: "(text | inlineimage)*",
				attrs: cellAttrs,
				tableRole: "cell",
				isolating: true,
				parseDOM: [{ tag: "td", getAttrs: (dom) => getCellAttrs(dom) }],
				toDOM(node) { return [defaultNameSpace + "td", setCellAttrs(node), 0] }
			},
			inlineimage: {
				inline: true,
				attrs: {
					imgid: { default: null },
					alt: { default: null }
				},
				parseDOM: [{
					tag: inlineImageSelector,
					getAttrs(dom) {
						return {
							imgid: imageStore.getImgid(dom.getAttributeNS(xlinkns, "href")),
							alt: dom.getAttribute("alt")
						};
					}
				}, {
					tag: "img",
					getAttrs(dom) {
						return {
							imgid: dom.getAttribute("imgid"),
							alt: dom.getAttribute("alt")
						};
					}
				}],
				leafText: () => "◪",
				toDOM(node) {
					if (defaultNameSpace) {
						return [defaultNameSpace + "image", {
							[xlinkns + " href"]: imageStore.getHref(node.attrs.imgid),
							alt: node.attrs.alt
						}];
					} else {
						return ["img", node.attrs];
					}
				}
			},
			text: { inline: true }
		},
		marks: {
			note: {
				attrs: { href: {} },
				excludes: "sub sup a note",
				parseDOM: [{
					tag: "a[type=note], note",
					getAttrs(dom) {
						const href = dom.getAttributeNS(xlinkns, "href") || dom.getAttribute("href");
						return href ? { href } : false;
					}
				}],
				toDOM(node) {
					if (defaultNameSpace) {
						return [defaultNameSpace + "a", {
							[xlinkns + " href"]: node.attrs.href,
							type: "note"
						}];
					} else {
						return ["note", node.attrs];
					}
				}
			},
			a: {
				attrs: { href: {} },
				excludes: "a note",
				parseDOM: [{
					tag: "a:not([type=note])",
					getAttrs(dom) {
						const href = dom.getAttributeNS(xlinkns, "href") || dom.getAttribute("href");
						return href ? { href } : false;
					}
				}],
				toDOM(node) {
					if (defaultNameSpace) {
						return [defaultNameSpace + "a", {
							[xlinkns + " href"]: node.attrs.href
						}];
					} else {
						return ["a", node.attrs];
					}
				}
			},
			code: {
				parseDOM: [{ tag: "code" }],
				toDOM() { return [defaultNameSpace + "code"] }
			},
			emphasis: {
				parseDOM: [{ tag: "emphasis, em, i" }],
				toDOM() { return defaultNameSpace ? [defaultNameSpace + "emphasis"] : ["em"] }
			},
			strong: {
				parseDOM: [{ tag: "strong, b" }],
				toDOM() { return [defaultNameSpace + "strong"] }
			},
			strikethrough: {
				parseDOM: [{ tag: "strikethrough, strike, s, del" }],
				toDOM() { return defaultNameSpace ? [defaultNameSpace + "strikethrough"] : ["s"] }
			},
			sup: {
				excludes: "sub sup",
				parseDOM: [{ tag: "sup" }],
				toDOM() { return [defaultNameSpace + "sup"] }
			},
			sub: {
				excludes: "sub sup",
				parseDOM: [{ tag: "sub" }],
				toDOM() { return [defaultNameSpace + "sub"] }
			}
		}
	});
};

const bodySchema = template("body", false);
const bodySchemaXML = template("body", true);

const annotationSchema = template("annotation", false);
const annotationSchemaXML = template("annotation", true);

const markBlocks = Object.keys(bodySchema.marks);

export { xmlTemplate, fb2ns, xlinkns, bodySchema, bodySchemaXML, annotationSchema, annotationSchemaXML, textBlocks, markBlocks };