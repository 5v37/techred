import { watchEffect, WatchHandle } from "vue";

import type { Node } from "prosemirror-model";
import type { NodeView } from "prosemirror-view";

import imageStore from "@/modules/imageStore";

class InlineImageView implements NodeView {
	private node: Node;

	dom: HTMLImageElement;
	private unwatch: WatchHandle;

	constructor(node: Node) {
		this.node = node;

		this.dom = document.createElement("img");
		this.dom.onerror = () => this.dom.classList.add("t-img-broken");
		this.updateAlt();

		this.unwatch = watchEffect(() => this.updateSrc());
	}

	update(node: Node): boolean {
		if (node.type !== this.node.type) return false;

		const oldAttrs = this.node.attrs;
		this.node = node;

		if (oldAttrs.href !== this.node.attrs.href) {
			this.updateSrc();
		};
		if (oldAttrs.alt !== this.node.attrs.alt) {
			this.updateAlt();
		};

		return true;
	}

	destroy() {
		this.unwatch();
	}

	private updateSrc() {
		const src = imageStore.getSrc(this.node.attrs.imgid);
		if (src) {
			this.dom.classList.remove("t-img-broken");
			this.dom.setAttribute("src", src);
		} else {
			this.dom.classList.add("t-img-broken");
			this.dom.removeAttribute("src");
		};
	}

	private updateAlt() {
		this.dom.setAttribute("alt", this.node.attrs.alt || "<нет данных для отображения>");
	}
}

export default InlineImageView;