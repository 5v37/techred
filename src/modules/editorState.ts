import { ref, reactive } from "vue";

import { EditorView } from "prosemirror-view";
import { TreeNode } from "primevue/treenode";

type bodiesType = { [key: string]: TreeNode };

class editorState {
	public views: { [key: string]: EditorView } = Object.create(null);
	public cancelEditorScroll = false;
	public menu = reactive<TreeNode[]>([]);
	public bodies: bodiesType = Object.create(null);
	public currentBody = ref("");
	public toolbars: { [key: string]: (view: EditorView) => void } = Object.create(null);

	private focusedView?: EditorView;

	saveViewFocus() {
		for (const view of Object.values(this.views)) {
			if (view.hasFocus()) {
				this.focusedView = view;
				this.focusedView.dom.blur();
				return;
			};
		};
		this.focusedView = undefined;
	}

	restoreViewFocus() {
		if (this.focusedView) {
			this.cancelEditorScroll = true;
			this.focusedView.dom.focus({ preventScroll: true });
			this.focusedView = undefined;
		};
	}

	setBody(key: string) {
		if (key !== "body0" && key !== this.currentBody.value) {
			this.currentBody.value = key;
			return true;
		};
		return false;
	}

	focusView(view: EditorView) {
		if (!view.hasFocus()) {
			view.dom.focus({ preventScroll: true });
		}
	}
};

export default new editorState();