import type { Mark, Node } from "prosemirror-model";
import type { EditorState, Transaction } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

class ui {
	public openImageCaptionDialog: (state: EditorState, dispatch: (tr: Transaction) => void, pos: number, caption: string) => void =
		() => { throw new Error("[UI] openImageCaptionDialog not initialized.") };
	public openElementIdDialog: (state: EditorState, dispatch: (tr: Transaction) => void, pos: number, id: string, key?: string) => void =
		() => { throw new Error("[UI] openElementIdDialog not initialized.") };
	public openLinkEditDialog: (state: EditorState, dispatch: (tr: Transaction) => void, mark?: Mark) => void =
		() => { throw new Error("[UI] openLinkEditDialog not initialized.") };
	public openSaveChangesDialog: () => Promise<"save" | "discard" | "cancel"> =
		() => Promise.reject(new Error("[UI] openSaveChangesDialog not initialized."));

	public showInsertBlockMenu: (event: Event, view: EditorView, node: Node, pos: number) => Promise<void> =
		() => Promise.reject(new Error("[UI] showInsertBlockMenu not initialized."));
};

export default new ui();