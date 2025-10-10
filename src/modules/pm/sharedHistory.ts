import { Command, Plugin } from "prosemirror-state";
import { undo, redo, history } from "prosemirror-history";
import editorState from "@/modules/editorState";

function createUndo(): Command {
	return (_state, dispatch) => {
		const undoList = historyTrace.undo;
		if (undoList.length) {
			const body = undoList[undoList.length - 1];
			const view = editorState.views[body];

			if (dispatch) {
				editorState.setBody(body);
				editorState.focusView(view);
				return undo(view.state, view.dispatch);
			} else {
				return undo(view.state);
			};
		} else {
			return false;
		};
	};
}

function createRedo(): Command {
	return (_state, dispatch) => {
		const redoList = historyTrace.redo;
		if (redoList.length) {
			const body = redoList[redoList.length - 1];
			const view = editorState.views[body];

			if (dispatch) {
				editorState.setBody(body);
				editorState.focusView(view);
				return redo(view.state, view.dispatch);
			} else {
				return redo(view.state);
			};
		} else {
			return false;
		};
	};
}

function sharedHistory(editorId: string, config = {}) {
	let historyPlugin = history(config);
	return new Plugin({
		key: historyPlugin.spec.key,
		state: {
			init: historyPlugin.spec.state!.init,
			apply(tr, hist, state, newState) {
				const undoCtx = hist.done.eventCount;
				const redoCtx = hist.undone.eventCount;

				const result = historyPlugin.spec.state!.apply(tr, hist, state, newState);

				const newUndoCtx = result.done.eventCount
				if (newUndoCtx > undoCtx) {
					let id = editorId;
					if (redoCtx - 1 === result.undone.eventCount) {
						id = historyTrace.redo.pop()!;
					} else {
						historyTrace.redo = [];
					};
					historyTrace.undo.push(id);
				} else if (newUndoCtx < undoCtx) {
					const id = historyTrace.undo.pop()!;
					historyTrace.redo.push(id);
				};

				return result;
			}
		},
		config,
		props: {
			handleDOMEvents: {
				beforeinput(view, e) {
					let inputType = e.inputType;
					let command = inputType == "historyUndo" ? sharedUndo : inputType == "historyRedo" ? sharedRedo : null;
					if (!command)
						return false;
					e.preventDefault();
					return command(view.state, view.dispatch);
				}
			}
		}
	});
}

function resetSharedHistory() {
	historyTrace.undo = [];
	historyTrace.redo = [];
}

const sharedUndo = createUndo();
const sharedRedo = createRedo();
const historyTrace: { undo: Array<string>, redo: Array<string> } = { undo: [], redo: [] };

export { sharedUndo, sharedRedo, sharedHistory, resetSharedHistory }