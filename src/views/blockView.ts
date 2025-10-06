import { NodeView, EditorView } from 'prosemirror-view';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import ui from '../ui';

class BlockView implements NodeView {
	node: ProseMirrorNode;
	view: EditorView;
	getPos: () => number | undefined;

	dom: HTMLElement;
	contentDOM: HTMLElement;
	idLabel: HTMLElement;

	constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined) {
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

		this.idLabel.addEventListener("mousedown", (e) => e.preventDefault());
		this.idLabel.addEventListener("click", () => {
			const pos = this.getPos();
			if (pos !== undefined) {
				ui.openIdInputDialog(this.view.state, this.view.dispatch, pos, this.node.attrs.id);
			}
		});

		this.dom.append(this.contentDOM, this.idLabel);
	}

	update(node: ProseMirrorNode): boolean {
		if (node.type !== this.node.type) return false;

		const oldAttrs = this.node.attrs;
		this.node = node;

		if (oldAttrs.uid !== this.node.attrs.uid) {
			this.contentDOM.setAttribute("uid", node.attrs.uid);
		};
		if (oldAttrs.id !== this.node.attrs.id) {
			this.updateIdLabel();
		}

		return true;
	}

	updateIdLabel() {
		const id = this.node.attrs.id || "<не установлен>";
		this.idLabel.textContent = `#${id}`;
	}
}

export default BlockView;