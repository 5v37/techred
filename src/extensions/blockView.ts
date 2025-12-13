import type { NodeView, EditorView } from "prosemirror-view";
import type { Node } from "prosemirror-model";

import ui from "@/modules/ui";

class BlockView implements NodeView {
	private node: Node;
	private view: EditorView;
	private getPos: () => number | undefined;

	dom: HTMLElement;
	contentDOM: HTMLElement;
	private idLabel: HTMLElement;

	constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
		this.node = node;
		this.view = view;
		this.getPos = getPos;

		this.dom = document.createElement("div");
		this.dom.style.position = "relative";

		this.contentDOM = document.createElement(node.type.name);
		if (node.attrs.uid) {
			this.contentDOM.setAttribute("uid", node.attrs.uid);
		};

		this.idLabel = document.createElement("id-label");
		this.idLabel.contentEditable = "false";
		this.updateIdLabel();

		this.idLabel.addEventListener("mousedown", this.handleSetId);

		this.dom.append(this.contentDOM, this.idLabel);
	}

	update(node: Node): boolean {
		if (node.type !== this.node.type) return false;

		const oldAttrs = this.node.attrs;
		this.node = node;

		if (oldAttrs.uid !== this.node.attrs.uid) {
			this.contentDOM.setAttribute("uid", node.attrs.uid);
		};
		if (oldAttrs.id !== this.node.attrs.id) {
			this.updateIdLabel();
		};

		return true;
	}

	destroy() {
		this.idLabel.removeEventListener("mousedown", this.handleSetId);
	}

	private updateIdLabel() {
		const id = this.node.attrs.id;
		if (id) {
			this.contentDOM.setAttribute("id", id);
		} else {
			this.contentDOM.removeAttribute("id");
		};
		this.idLabel.textContent = `#${id || "<не установлен>"}`;
	}

	private handleSetId = (event: MouseEvent) => {
		if (event.button === 0) {
			event.preventDefault();
			const pos = this.getPos();
			if (pos !== undefined) {
				ui.openIdInputDialog(this.view.state, this.view.dispatch, pos, this.node.attrs.id);
			};
		};
	}
}

export default BlockView;