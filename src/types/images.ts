import { parseDataURL } from "../utils";

type Image = {
	[id: string]: {
		type: string,
		content: string,
		dataURL: string
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
				dataURL: dataURL!
			};
		};
	};

	addAsContent(id: string, content: string | null, type: string | null) {
		if (type && content) {
			this.items[id] = {
				content: content,
				type: type,
				dataURL: "data:" + type + ";base64," + content
			};
		};
	};

	getByHref(href: string) {
		const id = href.slice(1);
		if (id) {
			return this.items[id];
		};
		return undefined;
	};
};

export default Images;