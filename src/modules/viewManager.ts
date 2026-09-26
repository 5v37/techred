import { EditorState, Transaction } from "prosemirror-state";
import { history, undo, redo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, chainCommands } from "prosemirror-commands";
import { Schema, DOMParser as ProseDOMParser, Node, Fragment } from "prosemirror-model";
import { EditorView, NodeViewConstructor } from "prosemirror-view";

import fb2Mapper from "@/modules/fb2Mapper";

import { expectedAttrs, expectedChild, setId, setLink, setMark, splitBlock } from "./commands";
import { NodeWithPos, removeEmptyMarks } from "./transform";
import PrettyDOMSerializer from "./prettyDOMSerializer";
import { annotationSchema, annotationSchemaXML, bodySchema, bodySchemaXML } from "./fb2Model";
import { goToNextCell, tableEditing } from "prosemirror-tables";
import linkTooltip from "@/extensions/linkTooltip";
import modificationMonitor from "@/extensions/modificationMonitor";
import { dropCursor } from "prosemirror-dropcursor";
import { TreeNode } from "primevue/treenode";
import editorState from "./editorState";
import { AttrStep, ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";

export interface ViewManager {
	id: string;
	state: EditorState;
	activeView: EditorView | undefined;

	registerView(partId: string, view: EditorView): void;
	dispatch(tr: Transaction): void;

	registerToolbar(updater: () => void): void;
}

export class DescManager implements ViewManager {
	public state: EditorState;
	public toolbarUpdater: (() => void) | undefined = undefined;

	private view: EditorView | undefined = undefined;

	get activeView() { return this.view }

	constructor(public id: string) {
		const doc = emptyDoc(annotationSchema);
		const plugins = getPlugins(annotationSchema, this);

		this.state = EditorState.create({ doc, plugins });
		fb2Mapper.addProcessor(this.parseContent, this.serializeContent, id, 1);
	}

	private parseContent = (bodyElement: Element | undefined) => {
		let doc = emptyDoc(annotationSchema);
		if (bodyElement && bodyElement.textContent) {
			doc = ProseDOMParser.fromSchema(annotationSchema).parse(bodyElement, { topNode: doc });
			doc = removeEmptyMarks(doc, annotationSchema);
		};

		this.state = EditorState.create({ doc, plugins: this.state.plugins });
		this.view?.updateState(this.state);
	};

	private serializeContent = (xmlDoc: Document, target: Element) => {
		if (this.hasContent()) {
			const doc = removeEmptyMarks(this.state.doc, annotationSchema);
			PrettyDOMSerializer.fromSchema(annotationSchemaXML).serializeFragment(doc.content, { document: xmlDoc }, target as HTMLElement);
		} else {
			target.remove();
		};
	};

	hasContent(): boolean {
		return this.state.doc.textContent !== "";
	}

	registerView(_partId: string, view: EditorView) {
		this.view = view;
	}

	dispatch(tr: Transaction) {
		this.state = this.state.apply(tr);
		this.view?.updateState(this.state);
		this.toolbarUpdater?.();
	}

	registerToolbar(updater: () => void) {
		this.toolbarUpdater = updater;
	}
}

export class BodyManager implements ViewManager {
	public state: EditorState;
	public toolbarUpdater: (() => void) | undefined = undefined;

	private views = new Map<string, EditorView>();
	private bodyOnView = new Map<string, string>();
	private lastFocusedViewId: string | null = null;
	private observer: IntersectionObserver;

	get activeView() { return this.lastFocusedViewId ? this.views.get(this.lastFocusedViewId) : undefined }

	constructor(public id: string) {
		const doc = emptyDoc(bodySchema);
		const plugins = getPlugins(bodySchema, this);

		this.state = EditorState.create({ doc, plugins });
		fb2Mapper.addProcessor(this.parseContent, this.serializeContent, id, 1);

		updateTOC(doc);
		this.observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting && entry.target) {
					entry.target.scrollTop = 0;
					this.observer.unobserve(entry.target);
				};
			});
		});
	}

	hasContent(): boolean {
		return this.state.doc.textContent !== "";
	}

	registerView(viewId: string, view: EditorView) {
		this.views.set(viewId, view);
		view.dom.addEventListener("focus", () => {
			if (this.lastFocusedViewId !== viewId) {
				this.lastFocusedViewId = viewId;
			};
		});

		const bodies = this.getBodies();
		if (this.views.size <= bodies.length) {
			this.switchViewToBody(viewId, bodies[this.views.size - 1]);
		};
	}

	registerToolbar(updater: () => void) {
		this.toolbarUpdater = updater;
	}

	getBodies() {
		const bodies: Array<string> = [];
		this.state.doc.descendants((node) => {
			bodies.push(node.attrs.uid);
			return false;
		});
		return bodies;
	}

	getBodyByPos(pos: number): NodeWithPos {
		let currentPos = 0;
		const content = this.state.doc.content;
		for (let i = 0; i < content.childCount; i++) {
			const body = content.child(i);
			const endPos = currentPos + body.nodeSize;

			if (pos >= currentPos && pos < endPos) {
				return { node: body, pos };
			};
			currentPos = endPos;
		}
		return undefined;
	}

	switchViewToBody(viewId: string, bodyUid: string) {
		const view = this.views.get(viewId);
		if (!view || this.bodyOnView.get(viewId) === bodyUid) return;

		view.setProps({
			nodeViews: {
				...view.props.nodeViews,
				body: bodyView(bodyUid)
			}
		});
		this.bodyOnView.set(viewId, bodyUid);
	}

	getBodyByView(viewId: string) {
		return this.bodyOnView.get(viewId);
	}

	private parseContent = (bodyElement: Element | undefined) => {
		let doc = emptyDoc(bodySchema);
		if (bodyElement && bodyElement.textContent) {
			const defaultDoc = doc;
			doc = ProseDOMParser.fromSchema(bodySchema).parse(bodyElement, { topNode: doc });
			doc = removeEmptyMarks(doc, bodySchema);
			if (doc.childCount == 1) {
				doc = doc.type.create(doc.attrs, doc.content.addToEnd(defaultDoc.lastChild!));
			};
		};

		this.state = EditorState.create({ doc, plugins: this.state.plugins });
		updateTOC(doc);

		let idx = 0;
		const bodies = this.getBodies();
		for (const [id, view] of this.views) {
			if (idx < bodies.length) {
				this.switchViewToBody(id, bodies[idx++]);
			};

			view.updateState(this.state);

			const container = view.dom.parentElement!;
			if (container.scrollHeight !== 0) {
				container.scrollTop = 0;
			} else {
				this.observer.observe(container);
			};
		};
	};

	private serializeContent = (xmlDoc: Document, target: Element) => {
		const doc = removeEmptyMarks(this.state.doc, bodySchema);
		const serializedBodies: Array<Node> = [];
		doc.content.forEach((child, _offset, index) => {
			if (index == 0 || child.textContent !== "") {
				serializedBodies.push(child);
			};
		});
		PrettyDOMSerializer.fromSchema(bodySchemaXML).serializeFragment(Fragment.from(serializedBodies), { document: xmlDoc }, target as HTMLElement);
	};

	public dispatch = (tr: Transaction) => {
		this.state = this.state.apply(tr);

		const activeBodyUid = this.lastFocusedViewId ? this.bodyOnView.get(this.lastFocusedViewId) : undefined;
		const targetBodyUid: string | undefined = this.getBodyByPos(this.state.selection.head)?.node.attrs.uid;
		if (targetBodyUid && targetBodyUid !== activeBodyUid) {
			for (const [viewId, uid] of this.bodyOnView) {
				if (uid === targetBodyUid) {
					this.views.get(viewId)?.focus();
					break;
				};
			};
		};

		for (const [id, view] of this.views) {
			view.updateState(this.state);

			if (id !== this.lastFocusedViewId) {
				// @ts-expect-error - domObserver является внутренним свойством
				view.domObserver.currentSelection.clear();
			};
		};

		this.toolbarUpdater?.();
		if (needUpdateTOC(tr, bodySchema)) {
			updateTOC(this.state.doc);
		};
	};
}

function emptyDoc(schema: Schema) {
	if (schema.topNodeType === schema.nodes.annotation) {
		const docType = schema.nodes.annotation;
		return docType.create(null, expectedChild(docType, schema));
	} else {
		const bodyType = schema.nodes.body;
		const content = [
			bodyType.create(expectedAttrs(bodyType, schema), expectedChild(bodyType, schema)),
			bodyType.create({ ...expectedAttrs(bodyType, schema), name: "notes" }, expectedChild(bodyType, schema))
		];

		const docType = schema.nodes.fb2;
		return docType.create(null, content);
	};
}

function getPlugins(schema: Schema, viewManager: ViewManager) {
	const custKeymap = baseKeymap;
	custKeymap["Enter"] = splitBlock(false);
	custKeymap["Shift-Enter"] = splitBlock(true);

	const plugins = [
		history(),
		keymap(custKeymap),
		keymap({
			"Mod-z": undo,
			"Mod-y": redo,
			"Mod-b": setMark(schema.marks.strong),
			"Mod-i": setMark(schema.marks.emphasis),
			"Mod-,": setMark(schema.marks.sub),
			"Mod-.": setMark(schema.marks.sup),
			"Mod-Shift-x": setMark(schema.marks.strikethrough),
			"Mod-Shift-m": setMark(schema.marks.code),
			"Mod-k": chainCommands(setLink(), () => true),
			"Mod-;": chainCommands(setId(false), () => true),
			"Mod-Shift-;": chainCommands(setId(true), () => true),
			"Tab": goToNextCell(1),
			"Shift-Tab": goToNextCell(-1)
		}),
		linkTooltip(viewManager),
		modificationMonitor(),
		tableEditing(),
		dropCursor()
	];

	return plugins;
}

function bodyView(bodyUid: string): NodeViewConstructor {
	return (node) => {
		const dom = document.createElement("div");
		if (node.attrs.uid === bodyUid) {
			dom.setAttribute("uid", bodyUid);
			return { dom, contentDOM: dom };
		} else {
			dom.style.display = "none";
			return { dom, ignoreMutation: () => true };
		}
	};
}

function updateTOC(doc: Node) {
	function getTitle(node: Node) {
		for (let idx = 0; idx < 2 && idx < node.childCount; idx++) {
			if (node.children[idx].type.name === "title") {
				const text: string[] = [];
				node.children[idx].content.forEach(p => {
					if (p.textContent) {
						text.push(p.textContent);
					};
				});
				return text.join(" ");
			};
		};
	}
	function getTOC(Node: Node) {
		const TOC: TreeNode[] = [];
		Node.forEach(node => {
			if (node.attrs.uid) {
				const label = getTitle(node) || "<section>";
				TOC.push({ key: node.attrs.uid, label, icon: "pi pi-fw pi-bookmark", type: "section", children: getTOC(node) });
			};
		});
		return TOC;
	}

	editorState.mainTOC.splice(0);
	doc.descendants((node: Node) => {
		const label = getTitle(node) || node.attrs.name || "<body>";
		editorState.mainTOC.push({ key: node.attrs.uid, label, icon: "pi pi-fw pi-bookmark-fill", type: "body", children: getTOC(node) });
		return false;
	});

}

function needUpdateTOC(transaction: Transaction, schema: Schema) {
	if (transaction.docChanged) {
		let hasChange = false;
		const isRelevantNode = (node: Node) => {
			return node.attrs.uid || (node.type === schema.nodes.title && node.textContent !== "");
		};
		for (const step of transaction.steps) {
			if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
				// Проверяем вставленный контент
				hasChange = step.slice.content.content.some(isRelevantNode);
				// Проверяем удаленный контент
				if (!hasChange) {
					const deletedFragment = transaction.before.slice(step.from, step.to).content;
					hasChange = deletedFragment.content.some(isRelevantNode);
				}
				// Проверяем редактирование внутри заголовка
				if (!hasChange) {
					const pos = transaction.doc.resolve(step.from);
					if (pos.depth > 1 && pos.node(pos.depth - 1).type === schema.nodes.title) {
						const parentType = pos.node(pos.depth - 2).type;
						hasChange = parentType === schema.nodes.section || parentType === schema.nodes.body;
					};
				};

				if (hasChange) {
					return true;
				};
			} else if (step instanceof AttrStep && step.attr === "name") {
				return true;
			}
		};
	};
	return false;
}