import { Mark } from "prosemirror-model";
import { EditorState, Transaction } from "prosemirror-state";

class ui {
	public openIdInputDialog: (state: EditorState, dispatch: (tr: Transaction) => void, pos: number, id: string, key?: string) => void = () => { };
	public openLinkEditorDialog: (state: EditorState, dispatch: (tr: Transaction) => void, mark?: Mark) => void = () => { };
};

export default new ui();