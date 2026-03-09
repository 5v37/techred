import type { NodeView, EditorView, ViewMutationRecord } from "prosemirror-view";
import type { Node } from "prosemirror-model";

import ui from "@/modules/ui";
import { deleteNodeByPos } from "@/modules/commands";

class BlockView implements NodeView {
	private node: Node;
	private view: EditorView;
	private getPos: () => number | undefined;

	dom: HTMLElement;
	contentDOM: HTMLElement;
	private idLabel: HTMLElement | undefined;
	private actions: HTMLElement;

	constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
		this.node = node;
		this.view = view;
		this.getPos = getPos;

		this.dom = document.createElement(`block-${node.type.name}`);
		this.dom.className = "block-wrapper";

		this.contentDOM = document.createElement(node.type.spec.tag ?? node.type.name);
		if (node.attrs.uid) {
			this.contentDOM.setAttribute("uid", node.attrs.uid);
		};
		this.dom.appendChild(this.contentDOM);

		if (node.type.spec.attrs && "id" in node.type.spec.attrs) {
			this.idLabel = document.createElement("id-label");
			this.idLabel.contentEditable = "false";
			this.updateIdLabel();
			this.dom.appendChild(this.idLabel);
		}

		this.actions = document.createElement("context-actions");
		this.actions.contentEditable = "false";

		if (!(node.isTextblock || node.type.contentMatch.edgeCount === 1 && node.type.contentMatch.edge(0).type.isTextblock)) {
			const insertBtn = document.createElement("insert-button");
			insertBtn.className = "action-command";
			insertBtn.textContent = "[+]";
			this.actions.appendChild(insertBtn);
		}

		// const menuBtn = document.createElement("block-menu");
		// menuBtn.className = "action-command";
		// menuBtn.textContent = "[...]";

		const deleteBtn = document.createElement("delete-button");
		deleteBtn.className = "action-command";
		deleteBtn.textContent = "[x]";
		this.actions.appendChild(deleteBtn);

		this.dom.appendChild(this.actions);

		this.addEventListeners();
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
		this.removeEventListeners();
	}

	private updateIdLabel() {
		const id = this.node.attrs.id;
		if (id) {
			this.contentDOM.setAttribute("id", id);
		} else {
			this.contentDOM.removeAttribute("id");
		};
		this.idLabel!.textContent = `#${id || "<не установлен>"}`;
	}

	private addEventListeners() {
		const insertBtn = this.dom.querySelector("insert-button") as HTMLElement;
		const deleteBtn = this.dom.querySelector("delete-button") as HTMLElement;

		this.idLabel?.addEventListener("mousedown", this.handleSetId);
		insertBtn?.addEventListener("mousedown", this.handleInsert);
		deleteBtn?.addEventListener("click", this.handleDelete);
	}

	private removeEventListeners() {
		const insertBtn = this.dom.querySelector("insert-button") as HTMLElement;
		const deleteBtn = this.dom.querySelector("delete-button") as HTMLElement;

		this.idLabel?.removeEventListener("mousedown", this.handleSetId);
		insertBtn?.removeEventListener("mousedown", this.handleInsert);
		deleteBtn?.removeEventListener("click", this.handleDelete);
	}

	private handleSetId = (event: MouseEvent) => {
		if (event.button === 0) {
			event.preventDefault();
			const pos = this.getPos();
			if (pos !== undefined) {
				ui.openElementIdDialog(this.view.state, this.view.dispatch, pos, this.node.attrs.id);
			};
		};
	};

	private handleInsert = (event: MouseEvent) => {
		if (event.button === 0) {
			event.preventDefault();
			const pos = this.getPos();
			if (pos !== undefined) {
				this.actions.classList.add("menu-showed");
				ui.showInsertBlockMenu(event, this.view, this.node, pos).then(() => {
					this.actions.classList.remove("menu-showed");
				});
			};
		};
	};

	private handleDelete = (event: MouseEvent) => {
		if (event.button === 0) {
			event.preventDefault();
			const pos = this.getPos();
			if (pos !== undefined) {
				deleteNodeByPos(this.node, pos)(this.view.state, this.view.dispatch);
			};
		};
	};

	ignoreMutation(mutation: ViewMutationRecord) {
		if (mutation.target === this.actions) {
			return true;
		};
		return false;
	}
}

export default BlockView;
