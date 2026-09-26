import { reactive, shallowReactive } from "vue";

import { EditorView } from "prosemirror-view";
import { TreeNode } from "primevue/treenode";

import {  ViewManager } from "@/modules/viewManager";

class editorState {

	viewManagers: ViewManager[] = [];

	public views: { [key: string]: EditorView } = Object.create(null);
	public cancelEditorScroll = false;
	public menu = reactive<TreeNode[]>([]);
	// public currentBody = ref("");

	mainTOC: TreeNode[] = shallowReactive([]);

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

	// setBody(key: string) {
	// 	if (key !== "body0" && key !== this.currentBody.value) {
	// 		this.currentBody.value = key;
	// 		return true;
	// 	};
	// 	return false;
	// }

	// ???
	// Из сайдбара: вычисляем в каком body элемент, если он есть в текущих view позиционируемся на него,
	//   если нет, в extra view меняем body, если требуемый body в обоих view позиционируемся в extra view
	// Из тултипа: вычисляем в каком body элемент, если он есть в соседнем view позиционируемся на него,
	//   если нет, в соседнем view меняем body,

};

export default new editorState();