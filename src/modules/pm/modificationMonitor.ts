import { Plugin, PluginKey } from "prosemirror-state";
import { undoDepth } from "prosemirror-history";
import { ref } from "vue";
import modificationTracker from "../modificationTracker";
import { CircularBuffer } from "../utils";

class MonitorState {
	public lastUndo: number;
	private idx = 0;
	private id = ref(0);
	private trace = new CircularBuffer<number>(100);

	constructor(undoDepth: number) {
		this.lastUndo = undoDepth;
		this.trace.push(this.idx);
		modificationTracker.register(this.id);
	}

	newId() {
		this.idx++;
		this.id.value = this.idx;
		this.trace.push(this.idx);
	}

	nextId() {
		this.id.value = this.trace.forward()!;
	}

	previousId() {
		this.id.value = this.trace.back()!;
	}

	dispose() {
		modificationTracker.unregister(this.id)
	}
}

function modificationMonitor() {
	return new Plugin({
		key: new PluginKey("modificationChecker"),
		state: {
			init(_config, instance) {
				return new MonitorState(undoDepth(instance));
			},
			apply(tr, checkerState, _oldState, newState) {
				const undoCount = undoDepth(newState);
				if (undoCount !== checkerState.lastUndo) {
					const hist = tr.getMeta("history$");
					if (hist) {
						if (hist.redo) {
							checkerState.nextId();
						} else {
							checkerState.previousId();
						};
					} else {
						checkerState.newId();
					};
					checkerState.lastUndo = undoCount;
				};

				return checkerState;
			}			
		}
	});
}

export default modificationMonitor;