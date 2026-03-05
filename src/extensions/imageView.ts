import { watchEffect, WatchHandle } from "vue";

import type { Node } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";

import ui from "@/modules/ui";
import imageStore from "@/modules/imageStore";
import { deleteNodeByPos } from "@/modules/commands";

class ImageView implements NodeView {
	private node: Node;
	private view: EditorView;
	private getPos: () => number | undefined;

	dom: HTMLElement;
	private figure: HTMLElement;
	private imageContent: HTMLImageElement;
	private idLabel: HTMLElement;
	private unwatch: WatchHandle;

	constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
		this.node = node;
		this.view = view;
		this.getPos = getPos;

		this.dom = document.createElement(`block-${node.type.name}`);
		this.dom.className = "block-wrapper";

		this.figure = document.createElement("figure");

		this.imageContent = document.createElement("img");
		this.imageContent.onerror = () => this.imageContent.classList.add("t-img-broken");

		this.figure.appendChild(this.imageContent);

		this.idLabel = document.createElement("id-label");
		this.idLabel.contentEditable = "false";
		this.updateIdLabel();

		this.updateAlt();
		this.updateCaption();

		const actions = document.createElement("context-actions");
		actions.contentEditable = "false";

		const captionBtn = document.createElement("caption-button");
		captionBtn.className = "action-command";
		captionBtn.textContent = "[~]";

		const deleteBtn = document.createElement("delete-button");
		deleteBtn.className = "action-command";
		deleteBtn.textContent = "[x]";

		actions.append(captionBtn, deleteBtn);
		this.dom.append(this.figure, this.idLabel, actions);

		this.addEventListeners();
		this.unwatch = watchEffect(() => this.updateSrc());
	}

	update(node: Node) {
		if (node.type !== this.node.type) return false;

		const oldAttrs = this.node.attrs;
		this.node = node;

		if (oldAttrs.title !== this.node.attrs.title) {
			this.updateCaption();
		};
		if (oldAttrs.imgid !== this.node.attrs.imgid) {
			this.updateSrc();
		};
		if (oldAttrs.alt !== this.node.attrs.alt) {
			this.updateAlt();
		};
		if (oldAttrs.id !== this.node.attrs.id) {
			this.updateIdLabel();
		};

		return true;
	}

	destroy() {
		this.removeEventListeners();
		this.unwatch();
	}

	private updateCaption() {
		const caption = this.figure.querySelector("figcaption");
		const title: string | null = this.node.attrs.title;
		if (title) {
			const element = caption || document.createElement("figcaption");
			element.textContent = title;
			if (!caption) {
				this.figure.appendChild(element);
			};
		} else {
			caption?.remove();
		};
	}

	private updateSrc() {
		const src = imageStore.getSrc(this.node.attrs.imgid);
		if (src) {
			this.imageContent.classList.remove("t-img-broken");
			this.imageContent.setAttribute("src", src);
		} else {
			this.imageContent.classList.add("t-img-broken");
			this.imageContent.removeAttribute("src");
		};
		this.updateInfo();
	}

	private updateInfo() {
		const info = imageStore.getInfo(this.node.attrs.imgid);
		const imgInfo = this.figure.querySelector("img-info");
		if (info) {
			const element = imgInfo || document.createElement("img-info");
			element.textContent = info;
			if (!imgInfo) {
				this.figure.appendChild(element);
			};
		} else {
			imgInfo?.remove();
		};
	}

	private updateAlt() {
		this.imageContent.setAttribute("alt", this.node.attrs.alt || "<нет данных для отображения>");
	}

	private updateIdLabel() {
		const id = this.node.attrs.id;
		if (id) {
			this.dom.setAttribute("id", id);
		} else {
			this.dom.removeAttribute("id");
		};
		this.idLabel.textContent = `#${id || "<не установлен>"}`;
	}

	private addEventListeners() {
		const captionBtn = this.dom.querySelector("caption-button") as HTMLElement;
		const deleteBtn = this.dom.querySelector("delete-button") as HTMLElement;

		this.idLabel.addEventListener("mousedown", this.handleSetId);
		captionBtn.addEventListener("mousedown", this.handleSetCaption);
		deleteBtn.addEventListener("click", this.handleDelete);
	}

	private removeEventListeners() {
		const captionBtn = this.dom.querySelector("caption-button") as HTMLElement;
		const deleteBtn = this.dom.querySelector("delete-button") as HTMLElement;

		this.idLabel.removeEventListener("mousedown", this.handleSetId);
		captionBtn.removeEventListener("mousedown", this.handleSetCaption);
		deleteBtn.removeEventListener("click", this.handleDelete);
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

	private handleSetCaption = (event: MouseEvent) => {
		if (event.button === 0) {
			event.preventDefault();
			const pos = this.getPos();
			if (pos !== undefined) {
				ui.openImageCaptionDialog(this.view.state, this.view.dispatch, pos, this.node.attrs.title);
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
}

export default ImageView;