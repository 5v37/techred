import { Mark } from "prosemirror-model";
import { EditorState, Transaction } from "prosemirror-state";

class ui {
	public openImageCaptionDialog: (state: EditorState, dispatch: (tr: Transaction) => void, pos: number, caption: string) => void =
		() => { throw new Error("[UI] openImageCaptionDialog not initialized.") };
	public openElementIdDialog: (state: EditorState, dispatch: (tr: Transaction) => void, pos: number, id: string, key?: string) => void =
		() => { throw new Error("[UI] openElementIdDialog not initialized.") };
	public openLinkEditDialog: (state: EditorState, dispatch: (tr: Transaction) => void, mark?: Mark) => void =
		() => { throw new Error("[UI] openLinkEditDialog not initialized.") };
	public openSaveChangesDialog: () => Promise<"save" | "discard" | "cancel"> =
		() => Promise.reject(new Error("[UI] openSaveChangesDialog not initialized."));
};

export default new ui();