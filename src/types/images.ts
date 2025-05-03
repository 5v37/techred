import { parseDataURL } from "../utils";

type Image = {
	[id: string]: {
		type: string,
		content: string,
		dataURL: string,
		newId: string
	}
}

class Images {
	items: Image = Object.create(null);

	addAsDataURL(id: string, dataURL?: string) {
		const data = parseDataURL(dataURL)
		if (data && data.base64) {
			this.items[id] = {
				content: data.data,
				type: data.mime,
				dataURL: dataURL!,
				newId: id
			};
		};
	};

	addAsContent(id: string, content: string | null, type: string | null) {
		if (type && content) {
			this.items[id] = {
				content: content,
				type: type,
				dataURL: "data:" + type + ";base64," + content,
				newId: id
			};
		};
	};

	getDataByHref(href: string) {
		if (href.startsWith("#")) {
			return this.items[href.slice(1)]?.dataURL ?? "";
		} else {
			return href;
		}
	};

	clear() {
		this.items = Object.create(null);
	}
};

export default Images;