import editorState from "@/modules/editorState";
import { invalidId } from "@/modules/notifications";
import { base64toData, imageFileType, parseDataURL } from "@/modules/utils";
import { NCNameFilter } from "@/modules/utils";

type ImageSpec = {
	type: string,
	content: string,
	dataURL: string,
	newId: string
};
type ImageList = {
	[id: string]: ImageSpec
};

function getExt(mime: string) {
	if (mime === "image/png")
		return "png";
	else if (mime === "image/jpeg" || mime === "image/jpg")
		return "jpg";
	else if (mime === "image/gif")
		return "gif";
}

let idx = 0;
function getValidId(id: string, mime: string, ids?: Set<string>) {
	ids ??= editorState.getIds();
	if (NCNameFilter.pattern.test(id) && !ids.has(id)) {
		return id;
	} else {
		const ext = getExt(mime) || id.split(".").pop();
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

	addAsDataURL(name: string, dataURL?: string, ids?: Set<string>) {
		const data = parseDataURL(dataURL);
		if (data?.base64) {
			const validId = getValidId(name, data.mime, ids);
			this.items[validId] = {
				content: data.data,
				type: data.mime,
				dataURL: dataURL!,
				newId: validId
			};
			return validId;
		};
	};

	addAsContent(id: string, content: string, type?: string | null, ids?: Set<string>) {
		const validType = type || imageFileType(base64toData(content.slice(0, 12)).buffer);
		if (content && validType) {
			const validId = getValidId(id, validType, ids);
			this.items[ids && ids.has(id) ? validId : id] = {
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

export type { ImageSpec };