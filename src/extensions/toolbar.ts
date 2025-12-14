import { Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import editorState from "@/modules/editorState"

class ToolbarView {
	private editorView: EditorView;
	private id: string;

	constructor(view: EditorView, editorId: string) {
		this.editorView = view;
		this.id = editorId;

		view.dom.addEventListener("focus", this.handleOnFocus);

		this.update(view);
	}

	update(view: EditorView) {
		editorState.toolbars[this.id](view);
	}

	destroy() {
		this.editorView.dom.removeEventListener("focus", this.handleOnFocus);
	}

	private handleOnFocus = () => {
		this.update(this.editorView);
	};
}

export default function toolbar(editorId: string) {
	return new Plugin({
		view(editorView) { return new ToolbarView(editorView, editorId); }
	});
}