import { watchEffect, WatchHandle } from "vue";

import type { Node } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";

import editorState from "@/modules/editorState";
import ui from "@/modules/ui";

class ImageView implements NodeView {
    private node: Node;
    private view: EditorView;
    private getPos: () => number | undefined;

    private dom: HTMLElement;
    private imageContent: HTMLImageElement;
    private idLabel: HTMLElement;
    private unwatch: WatchHandle;

    constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
        this.node = node;
        this.view = view;
        this.getPos = getPos;

        this.dom = this.createView();

        this.idLabel = this.dom.querySelector("id-label")!;
        this.imageContent = this.dom.querySelector(".image-content")!;
        this.imageContent.onerror = () => this.imageContent.classList.add("t-img-broken");

        this.updateCaption();
        this.updateAlt();
        this.updateIdLabel();

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
        if (oldAttrs.href !== this.node.attrs.href) {
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

    private createView() {
        const figure = document.createElement("figure");
        figure.className = "t-image_view";
        figure.innerHTML = `
        <id-label content-editable="false"></id-label>
        <div class="image-actions">
            <button class="t-button-secondary image-edit"><span class="pi pi-pencil"></span></button>
            <button class="t-button-secondary image-remove"><span class="pi pi-trash"></span></button>
        </div>
        <img class="image-content"/>`;

        return figure;
    }

    private updateCaption() {
        const caption = this.dom.querySelector('figcaption');
        const title: string | null = this.node.attrs.title;
        if (title) {
            const element = caption || document.createElement('figcaption');
            element.className = 'image-caption';
            element.textContent = title;
            if (!caption) {
                this.dom.appendChild(element);
            };
        } else {
            caption?.remove();
        };
    }

    private updateSrc() {
        const href: string | null = this.node.attrs.href;
        const src = href && editorState.images.value.getDataByHref(href);
        if (src) {
            this.imageContent.classList.remove("t-img-broken");
            this.imageContent.setAttribute("src", src);
        } else {
            this.imageContent.classList.add("t-img-broken");
            this.imageContent.removeAttribute("src");
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
        const editButton = this.dom.querySelector(".image-edit") as HTMLElement;
        const removeButton = this.dom.querySelector(".image-remove") as HTMLElement;

        this.idLabel.addEventListener("mousedown", this.handleSetId);
        editButton.addEventListener('mousedown', this.handleEdit);
        removeButton.addEventListener('mousedown', this.handleRemove);
    }

    private removeEventListeners() {
        const editButton = this.dom.querySelector(".image-edit") as HTMLElement;
        const removeButton = this.dom.querySelector(".image-remove") as HTMLElement;

        this.idLabel.removeEventListener("mousedown", this.handleSetId);
        editButton.removeEventListener("mousedown", this.handleEdit);
        removeButton.removeEventListener("mousedown", this.handleRemove);
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

    private handleEdit = (event: MouseEvent) => {
        if (event.button === 0) {
            event.preventDefault();
            const pos = this.getPos();
            if (pos !== undefined) {
                ui.openImageEditDialog(this.view.state, this.view.dispatch, pos, this.node.attrs.title);
            };
        };
    }

    private handleRemove = (event: MouseEvent) => {
        if (event.button === 0) {
            event.preventDefault();
            let tr = this.view.state.tr;
            const pos = this.getPos();
            if (pos !== undefined) {
                tr.delete(pos, pos + 1);
                this.view.dispatch(tr.scrollIntoView());
            };
        };
    }
}

export default ImageView;