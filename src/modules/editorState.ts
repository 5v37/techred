import { ref, reactive } from 'vue';

import { EditorView } from "prosemirror-view";
import { TreeNode } from 'primevue/treenode';

import Images from '@/types/images';

type bodiesType = { [key: string]: TreeNode };

class editorState {
	public views: { [key: string]: EditorView } = Object.create(null);
	public cancelEditorScroll = false;
	public images = ref<Images>(new Images);
	public menu = reactive<TreeNode[]>([]);
	public bodies: bodiesType = Object.create(null);
	public currentBody = ref("");
	public spellCheckOn = ref(false);
	public highlightEmphasisOn = ref(true);
	public toolbars: { [key: string]: (view: EditorView) => void } = Object.create(null);

	private focusedView?: EditorView;

	getIds(noImage = false) {
		const ids = new Set<string>(noImage ? undefined : this.images.value.getIds());
		for (const body of Object.keys(this.bodies)) {
			this.views[body].state.doc.descendants((node) => {
				if (node.attrs.id) {
					ids.add(node.attrs.id);
				};
			});
		};
		return ids;
	}

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
		};
	}

	focusView(view: EditorView) {
		if (!view.hasFocus()) {
			view.dom.focus({ preventScroll: true });
		}
	}
};

export default new editorState();