import { base64toData, imageFileType, parseDataURL } from "@/modules/utils";
import { validateId, generateUniqueFileName, clearIdCache } from "@/modules/idManager";
import { invalidId } from "@/modules/notifications";

type ImageSpec = {
	type: string,
	content: string,
	dataURL: string,
	id: {
		validValue: string,
		invalid: boolean,
		draftValue: string,
		error: string
	}
};

type ImageList = {
	[id: string]: ImageSpec
};

class Images {
	items: ImageList = Object.create(null);

	addAsDataURL(name: string, dataURL: string) {
		const data = parseDataURL(dataURL);
		if (data?.base64) {
			const validId = generateUniqueFileName(name, data.mime);
			this.items[validId] = {
				content: data.data,
				type: data.mime,
				dataURL: dataURL,
				id: {
					validValue: validId,
					invalid: false,
					draftValue: validId,
					error: ""
				}
			};
			if (validId !== name) {
				invalidId(name, validId);
			}
			clearIdCache();
			return validId;
		};
	};

	addAsContent(id: string, content: string, type: string | null, ids: Set<string>) {
		const validType = type || imageFileType(base64toData(content.slice(0, 12)).buffer);
		if (content && validType) {
			const idValidation = validateId(id, ids, false);
			this.items[id] = {
				content: content,
				type: validType,
				dataURL: "data:" + validType + ";base64," + content,
				id: {
					validValue: id,
					invalid: idValidation.invalid,
					draftValue: id,
					error: idValidation.error
				}
			};
			return id;
		};
	};

	getDataByHref(href: string) {
		if (href.startsWith("#")) {
			return this.items[href.slice(1)]?.dataURL ?? "";
		} else {
			return href;
		}
	};

	getIds(targetId?: string) {
		const result = new Set<string>();
		let targetCount = 0;

		for (const key in this.items) {
			const id = this.items[key].id.validValue;
			if (id === targetId) {
				targetCount++;
			} else {
				result.add(id);
			}
		}

		if (targetCount > 1 && targetId) {
			result.add(targetId);
		}

		return result;
	}

	clear() {
		this.items = Object.create(null);
	}
};

export default Images;

export type { ImageSpec };