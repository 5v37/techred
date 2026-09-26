import type { EditorView } from "prosemirror-view";
import type { Mark, Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { DOMSerializer } from "prosemirror-model";
import { openUrl } from "@tauri-apps/plugin-opener";

import { setLink, updateLink } from "@/modules/commands";
import { findNodeWithPosByAttr, type NodeWithPos } from "@/modules/transform";
import { ViewManager } from "@/modules/viewManager";

class LinkTooltipView {
	private view: EditorView;
	private viewManager: ViewManager;
	private root: HTMLElement;
	private tooltip: HTMLElement;
	private url: HTMLElement;
	private preview: HTMLElement;
	private displayed: boolean;
	private broken: boolean;
	private link: Mark | undefined;
	private target: NodeWithPos;

	constructor(view: EditorView, viewManager: ViewManager) {
		this.view = view;
		this.viewManager = viewManager;
		this.root = view.dom.parentElement!;

		this.tooltip = this.createTooltip();
		this.url = this.tooltip.querySelector(".link-url")!;
		this.preview = this.tooltip.querySelector(".link-preview")!;

		this.addEventListeners();
		this.root.append(this.tooltip);

		this.displayed = false;
		this.broken = false;
		this.link = undefined;
		this.target = undefined;
		this.update(view);
	}

	update(view: EditorView) {
		if (this.viewManager.activeView !== this.view) {
			this.hideTooltip();
			return;
		};

		const $to = view.state.selection.$to;
		const schema = view.state.schema;
		this.link = $to.marks().find(mark => mark.type === schema.marks.a || mark.type === schema.marks.note);
		this.target = undefined;
		this.broken = false;
		if (this.link) {
			const href = this.link.attrs.href as string;
			if (href.startsWith("#")) {
				this.target = findNodeWithPosByAttr(view.state.doc, "id", href.slice(1));
				this.broken = !this.target;
			} else {
				try { new URL(href) } catch { this.broken = true };
			};
			this.showTooltip(href, $to.pos, schema);
		} else {
			this.hideTooltip();
		};
	}

	destroy() {
		this.removeEventListeners();
		this.tooltip.remove();
	}

	private createTooltip() {
		const tooltip = document.createElement("div");
		tooltip.className = "t-link-tooltip";
		tooltip.style.display = "none";

		tooltip.innerHTML = `
        <div class="link-container">
            <div class="link-header">
                <div class="link-url">#id</div>
                <div class="link-actions">
                    <button class="t-button-secondary link-edit"><span class="pi pi-pencil"></span></button>
                    <button class="t-button-secondary link-remove"><span class="pi pi-trash"></span></button>
                </div>
            </div>
            <div class="ProseMirror link-preview"></div>
        </div>`;

		return tooltip;
	}

	private showTooltip(href: string, pos: number, schema: Schema) {
		this.displayed = true;
		this.url.innerHTML = href;
		if (this.broken) {
			this.url.setAttribute("broken", "");
		} else {
			this.url.removeAttribute("broken");
		};

		this.updatePreview(schema);
		this.positionTooltip(pos);
	}

	private updatePreview(schema: Schema) {
		if (this.target) {
			let header = "", block = "";
			const serializer = DOMSerializer.fromSchema(schema);
			if (this.target.node.isTextblock) {
				const text = serializer.serializeNode(this.target.node) as HTMLElement;
				block = text.innerHTML;
			} else {
				try {
					this.target.node.descendants((node) => {
						if (node.type === schema.nodes.title && node.childCount) {
							const title = serializer.serializeNode(node.firstChild!) as HTMLElement;
							header = `<strong>${title.innerHTML}</strong>   `;
							return false;
						};
						if (node.type.isTextblock) {
							const text = serializer.serializeNode(node) as HTMLElement;
							block = text.innerHTML;
							throw block;
						};
					});
				} catch (e) {
					if (e !== block) {
						throw e;
					};
				};
			};

			this.preview.innerHTML = header + block;
			this.preview.style.display = "";
		} else {
			this.preview.style.display = "none";
		}
	}

	private hideTooltip() {
		if (this.displayed) {
			this.displayed = false;
			this.tooltip.style.display = "none";
		};
	}

	private positionTooltip(pos: number) {
		this.tooltip.style.left = "";
		this.tooltip.style.top = "";
		this.tooltip.style.display = "";

		const coords = this.view.coordsAtPos(pos);
		const editorRect2 = this.root.getBoundingClientRect();
		const tooltipRect = this.tooltip.getBoundingClientRect();

		const top = coords.bottom - editorRect2.top + this.root.scrollTop + 5;
		let left = coords.left - editorRect2.left;
		if (coords.left + tooltipRect.width > editorRect2.right) {
			left -= tooltipRect.width;
		};

		this.tooltip.style.top = top + "px";
		this.tooltip.style.left = left + "px";
	}

	private addEventListeners() {
		const editBtn = this.tooltip.querySelector(".link-edit") as HTMLElement;
		const removeBtn = this.tooltip.querySelector(".link-remove") as HTMLElement;

		this.url.addEventListener("mousedown", this.handleOpenLink);
		editBtn.addEventListener("mousedown", this.handleEditLink);
		removeBtn.addEventListener("mousedown", this.handleRemoveLink);
	}

	private removeEventListeners() {
		const editBtn = this.tooltip.querySelector(".link-edit") as HTMLElement;
		const removeBtn = this.tooltip.querySelector(".link-remove") as HTMLElement;

		this.url.removeEventListener("mousedown", this.handleOpenLink);
		editBtn.removeEventListener("mousedown", this.handleEditLink);
		removeBtn.removeEventListener("mousedown", this.handleRemoveLink);
	}

	private handleOpenLink = (event: MouseEvent) => {
		if (event.button === 0) {
			event.preventDefault();

			if (this.target) {
				const selector = this.target.node.attrs.uid ? `[uid="${this.target.node.attrs.uid}"]` : `[id="${this.target.node.attrs.id}"]`;
				queueMicrotask(() => {
					const element = document.querySelector(selector);
					if (element) {
						element.scrollIntoView();
					};
				});
			} else if (!this.broken) {
				if (__APP_TAURI_MODE__) {
					openUrl(this.link!.attrs.href);
				} else {
					open(this.link!.attrs.href, "_blank", "noopener,noreferrer");
				};
			};
		};
	};

	private handleEditLink = (event: MouseEvent) => {
		if (event.button === 0) {
			event.preventDefault();
			setLink()(this.view.state, this.view.dispatch);
		};
	};

	private handleRemoveLink = (event: MouseEvent) => {
		if (event.button === 0) {
			event.preventDefault();
			updateLink(undefined, this.link!.type)(this.view.state, this.view.dispatch);
		};
	};
}

export default function linkTooltip(viewManager: ViewManager) {
	return new Plugin({
		view(editorView) { return new LinkTooltipView(editorView, viewManager) }
	});
}