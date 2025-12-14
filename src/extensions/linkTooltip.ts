import { Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { Node, Mark } from "prosemirror-model";
import { openUrl } from "@tauri-apps/plugin-opener";

import { setLink, updateLink } from "@/modules/commands";
import editorState from "@/modules/editorState";

class LinkTooltipView {
	private view: EditorView;
	private root: HTMLElement;
	private tooltip: HTMLElement;
	private url: HTMLElement;
	private preview: HTMLElement;
	private displayed: boolean;
	private broken: boolean;
	private link: Mark | undefined;
	private target: { node: Node, body: string, pos: number } | undefined;

	constructor(view: EditorView, root: HTMLElement) {
		this.view = view;
		this.root = root;

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
		const $to = view.state.selection.$to;
		this.link = $to.marks().find(mark => mark.type === view.state.schema.marks.a || mark.type === view.state.schema.marks.note);
		this.target = undefined;
		this.broken = false;
		if (this.link) {
			const href = this.link.attrs.href as string;
			if (href.startsWith("#")) {
				this.target = getNodeById(href.slice(1));
				this.broken = !this.target;
			} else {
				try { new URL(href) } catch { this.broken = true };
			};
			this.showTooltip(href, $to.pos);
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

	private showTooltip(href: string, pos: number) {
		this.displayed = true;
		this.url.innerHTML = href;
		if (this.broken) {
			this.url.setAttribute("broken", "");
		} else {
			this.url.removeAttribute("broken");
		};

		this.updatePreview();
		this.positionTooltip(pos);
	}

	private updatePreview() {
		if (this.target) {
			let header = "", block = "";
			const view = editorState.views[this.target.body];
			if (this.target.node.isTextblock) {
				const text = view.nodeDOM(this.target!.pos)! as HTMLElement;
				block = text.innerHTML;
			} else {
				try {
					this.target.node.descendants((node, pos) => {
						if (node.type === view.state.schema.nodes.title) {
							const title = view.nodeDOM(this.target!.pos + pos + 1)!.firstChild! as HTMLElement;
							header = `<strong>${title.innerHTML}</strong>   `;
							return false;
						};
						if (node.type.isTextblock) {
							const text = view.nodeDOM(this.target!.pos + pos + 1)! as HTMLElement;
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
				editorState.setBody(this.target.body);
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

function getNodeById(id: string) {
	let target: { node: Node, body: string, pos: number; } | undefined;
	try {
		for (const body in editorState.bodies) {
			editorState.views[body].state.doc.descendants((node, pos) => {
				if (node.attrs.id === id) {
					target = { node, body, pos };
					throw target;
				};
			});
		};
	} catch (e) {
		if (e !== target) {
			throw e;
		};
	};

	return target;
}

export default function linkTooltip(root: HTMLElement) {
	return new Plugin({
		view(editorView) { return new LinkTooltipView(editorView, root); }
	});
}