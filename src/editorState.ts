import { ref, reactive } from 'vue';

import { EditorView } from "prosemirror-view";
import { TreeNode } from 'primevue/treenode';

import Images from './types/images';

type bodiesType = { [key: string]: TreeNode };

class editorState {
    private views: { [key: string]: EditorView } = {};
    public images = ref<Images>(new Images);
    public menu = reactive<TreeNode[]>([]);
    public bodies: bodiesType = {};
    public spellCheckOn = ref(false);
    public highlightEmphasisOn = ref(true);

    setView(id: string, view: EditorView) {
        this.views[id] = view;
    }

    getView(id: string) {
        return this.views[id];
    }

    getIds(noImage = false) {
        const ids = new Set<string>(noImage ? undefined : Object.keys(this.images.value.items));
        for (const body of Object.keys(this.bodies)) {
            this.getView(body).state.doc.descendants((node) => {
                if (node.attrs.inid) {
                    ids.add(node.attrs.inid);
                };
            });
        };
        return ids;
    }
};

export default new editorState();