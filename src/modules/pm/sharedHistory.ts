import { Command, Plugin } from "prosemirror-state";
import { undo, redo, history } from "prosemirror-history";
import { RingBuffer } from "@toolbuilder/ring-buffer";
import editorState from "@/modules/editorState";
import type { EditorView } from "prosemirror-view";

function createCommand(isUndo: boolean): Command {
	return (_state, dispatch) => {
		const list = isUndo ? historyTrace.undo : historyTrace.redo;
		if (list.length) {
			if (dispatch) {
				const command = isUndo ? undo : redo;

				const lastValue = list.back();
				let groupSize = 1;
				if (typeof lastValue === "number") {
					groupSize = lastValue;
					list.pop();
				};
				let focusGroup = isUndo ? 0 : groupSize - 1;

				let body: string, view: EditorView;
				startHistoryGroup();
				while (groupSize > 0) {
					body = list.back() as string;
					view = editorState.views[body];

					groupSize--;
					if (groupSize === focusGroup) {
						editorState.setBody(body);
						editorState.focusView(view); // !!! надо дождаться смены вкладки для правильной фокусировки
					};

					command(view.state, view.dispatch);
				};
				endHistoryGroup();
			};
			return true;
		} else {
			return false;
		};
	};
}

function sharedHistory(editorId: string, newGroupDelay = 500) {
	const historyPlugin = history({ depth: traceDepth, newGroupDelay: newGroupDelay });
	return new Plugin({
		key: historyPlugin.spec.key,
		state: {
			init: historyPlugin.spec.state!.init,
			apply(tr, hist, state, newState) {
				const undoCtx = hist.done.eventCount;
				const redoCtx = hist.undone.eventCount;

				const result = historyPlugin.spec.state!.apply(tr, hist, state, newState);

				const newUndoCtx = result.done.eventCount;
				if (newUndoCtx > undoCtx) {
					let id = editorId;
					if (redoCtx - 1 === result.undone.eventCount) {
						id = historyTrace.redo.pop() as string;
					} else {
						historyTrace.redo.clear();
					};
					historyTrace.undo.push(id);
					if (isGroup) groupIdx++;
				} else if (newUndoCtx < undoCtx) {
					const id = historyTrace.undo.pop() as string;
					historyTrace.redo.push(id);
					if (isGroup) groupIdx--;
				};

				return result;
			}
		},
		config: historyPlugin.spec.config,
		props: {
			handleDOMEvents: {
				beforeinput(view, e) {
					let inputType = e.inputType;
					let command = inputType === "historyUndo" ? sharedUndo : inputType === "historyRedo" ? sharedRedo : null;
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
	historyTrace.undo.clear();
	historyTrace.redo.clear();
}

let groupIdx = 0, isGroup = false;
function startHistoryGroup() {
	if (isGroup) {
		throw "Группировка истории изменений уже начата";
	}
	isGroup = true;
	groupIdx = 0;
}

function endHistoryGroup() {
	isGroup = false;
	if (Math.abs(groupIdx) > 1) {
		if (groupIdx > 0) {
			historyTrace.undo.push(groupIdx);
		} else {
			historyTrace.redo.push(-groupIdx);
		};
		groupIdx = 0;
	};
}

const traceDepth = 100;
const sharedUndo = createCommand(true);
const sharedRedo = createCommand(false);
const historyTrace: { undo: RingBuffer, redo: RingBuffer } = { undo: new RingBuffer(traceDepth), redo: new RingBuffer(traceDepth) };

export { sharedUndo, sharedRedo, sharedHistory, resetSharedHistory, startHistoryGroup, endHistoryGroup }