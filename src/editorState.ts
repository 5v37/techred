import { reactive } from 'vue';

import { EditorView } from "prosemirror-view";
import { TreeNode } from 'primevue/treenode';

class editorState {
    private views: { [key: string]: EditorView } = {};
    private tocs: { [key: string]: TreeNode[] } = {};

    setView(id: string, view: EditorView) {
        this.views[id] = view;
    }

    getView(id: string) {
        return this.views[id];
    }

    setTOC(id: string, TOC: TreeNode[]) {
        this.initTOC(id);
        this.tocs[id].length = 0;
        Object.assign(this.tocs[id], TOC);
    }

    getTOC(id: string) {
        this.initTOC(id);
        return this.tocs[id];
    }

    private initTOC(id: string) {
        if (!this.tocs[id]) {
            this.tocs[id] = reactive<TreeNode[]>([]);
        };
    }
};

export default new editorState();