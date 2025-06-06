import { ref, reactive } from 'vue';

import { EditorView } from "prosemirror-view";
import { TreeNode } from 'primevue/treenode';

import Images from './types/images';

type bodiesType = { [key: string]: { name: string, toc: TreeNode } };

class editorState {
    private views: { [key: string]: EditorView } = {};
    public images = ref<Images>(new Images);
    public menu = reactive<TreeNode[]>([]);
    public bodies: bodiesType = {};
    public spellCheckOn = ref(false);

    setView(id: string, view: EditorView) {
        this.views[id] = view;
    }

    getView(id: string) {
        return this.views[id];
    }
};

export default new editorState();