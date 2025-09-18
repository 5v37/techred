import { EditorState, Transaction } from "prosemirror-state";

class ui {
	public openIdInputDialog: (state: EditorState, dispatch: (tr: Transaction) => void, pos: number, id: string, key?: string) => void = () => { };
};

export default new ui();