import type { Ref } from "vue";
import { ref, watch } from "vue";

class ModificationTracker {
	public docModified = ref(false);
	private modificationCheckers: Array<ModificationCheckers> = [];

	refresh(isModified = false) {
		if (isModified) {
			this.docModified.value = true;
		} else {
			this.docModified.value = false;
			for (const checker of this.modificationCheckers) {
				if (checker.isModified) {
					this.docModified.value = true;
					break;
				};
			};
		};
	}

	register(model: Ref) {
		this.modificationCheckers.push(new ModificationCheckers(model));
	}

	unregister(model: Ref) {
		this.modificationCheckers = this.modificationCheckers.filter(checker => !checker.match(model));
	}

	reset(isNewData: boolean) {
		for (const checker of this.modificationCheckers) {
			checker.reset(isNewData);
		};
		this.docModified.value = false;
	}
}

const modificationTracker = new ModificationTracker();

class ModificationCheckers {
	public isModified: boolean;
	private initialData: string;
	private _model: Ref;
	private skipInit = false;

	constructor(model: Ref) {
		this.isModified = false;
		this.initialData = JSON.stringify(model.value);
		this._model = model;
		watch(model, (newValue) => {
			if (this.skipInit) {
				this.skipInit = false;
			} else {
				this.isModified = JSON.stringify(newValue) !== this.initialData;
				modificationTracker.refresh(this.isModified);
			};
		}, { deep: true });
	}

	reset(isNewData: boolean) {
		this.isModified = false;
		const initialData = JSON.stringify(this._model.value);
		this.skipInit = isNewData && this.initialData !== initialData;
		this.initialData = initialData;
	}

	match(model: Ref) {
		return this._model === model;
	}
}

export default modificationTracker;