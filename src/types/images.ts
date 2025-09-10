import editorState from "../editorState";
import { invalidId } from "../notification";
import { base64toData, imageFileType, parseDataURL } from "../utils";
import { NCNameFilter } from '../utils';

type ImageSpec = {
	type: string,
	content: string,
	dataURL: string,
	newId: string
}
type ImageList = {
	[id: string]: ImageSpec
}

let idx = 0;
function getValidId(id: string, mime: string) {
	const ids = editorState.getIds();
	if (NCNameFilter.pattern.test(id) && !ids.has(id)) {
		return id;
	} else {
		const ext = mime === "image/png" ? "png" : "jpg";
		let newId: string;
		while (newId = `img_${idx}.${ext}`, ids.has(newId)) {
			idx++;
		};
		invalidId(id, newId);
		return newId;
	};
}

class Images {
	items: ImageList = Object.create(null);

	addAsDataURL(name: string, dataURL?: string) {
		const data = parseDataURL(dataURL);
		if (data && data.base64) {
			const validId = getValidId(name, data.mime);
			this.items[validId] = {
				content: data.data,
				type: data.mime,
				dataURL: dataURL!,
				newId: validId
			};
			return validId;
		};
	};

	addAsContent(id: string, content: string, type: string | null) {
		const validType = type || imageFileType(base64toData(content.slice(0, 12)).buffer);
		if (content && validType) {
			const validId = id;//getValidId(id, validType);
			this.items[id] = {
				content: content,
				type: validType,
				dataURL: "data:" + type + ";base64," + content,
				newId: validId
			};
			return validId;
		};
	};

	getDataByHref(href: string) {
		if (href.startsWith("#")) {
			return this.items[href.slice(1)]?.dataURL ?? "";
		} else {
			return href;
		}
	};

	getIds() {
		return Object.entries(this.items).map(item => item[1].newId ? item[1].newId : item[0]);
	}

	clear() {
		this.items = Object.create(null);
	}
};

export default Images;

export type { ImageSpec }