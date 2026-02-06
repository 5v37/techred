import { reactive } from "vue";

import { base64toData, imageFileType, parseDataURL } from "@/modules/utils";
import { validateId, generateUniqueFileName } from "@/modules/idManager";
import { invalidId } from "@/modules/notifications";
import editorState from "@/modules/editorState";

type ImageSpec = {
	kind: "internal",
	imgid: string,
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

type ExternalImageSpec = {
	kind: "external",
	imgid: string,
	href: string
};

class ImageStore {
	private allImages = new Map<string, ImageSpec | ExternalImageSpec>();
	private activeIds = new Set<string>();
	private reservedIds = new Map<string, string>();
	private trackedIds = new Set<string>();

	addAsDataURL(name: string, dataURL: string) {
		const data = parseDataURL(dataURL);
		if (data?.base64) {
			const imgid = self.crypto.randomUUID();
			const validId = generateUniqueFileName(name, data.mime);
			this.allImages.set(imgid, {
				kind: "internal",
				imgid: imgid,
				content: data.data,
				type: data.mime,
				dataURL: dataURL,
				id: {
					validValue: validId,
					invalid: false,
					draftValue: validId,
					error: ""
				}
			});
			if (validId !== name) {
				invalidId(name, validId);
			}
			return imgid;
		};
	}

	addAsRef(href: string) {
		const imgid = self.crypto.randomUUID();
		this.allImages.set(imgid, {
			kind: "external",
			imgid: imgid,
			href: href
		});
		return imgid;
	}

	addAsContent(id: string, content: string, type: string | null, ids: Set<string>) {
		const validType = type || imageFileType(base64toData(content.slice(0, 12)).buffer);
		if (content && validType) {
			let imgid = this.reservedIds.get(id);
			if (imgid) {
				this.reservedIds.delete(id);
			} else {
				imgid = self.crypto.randomUUID();
			};
			const idValidation = validateId(id, ids, false);
			this.allImages.set(imgid, {
				kind: "internal",
				imgid: imgid,
				content: content,
				type: validType,
				dataURL: "data:" + validType + ";base64," + content,
				id: {
					validValue: id,
					invalid: idValidation.invalid,
					draftValue: id,
					error: idValidation.error
				}
			});
			return imgid;
		};
	}

	getSrc(imgid: string) {
		const image = this.allImages.get(imgid);
		if (image) {
			if (image.kind === "external") {
				return image.href;
			} else {
				return image.dataURL;
			};
		} else {
			return "";
		};
	}

	getId(imgid: string) {
		const image = this.allImages.get(imgid);
		if (image && image.kind === "internal") {
			return image.id.validValue;
		} else {
			return "";
		};
	}

	getHref(imgid: string) {
		const image = this.allImages.get(imgid);
		if (image) {
			if (image.kind === "external") {
				return image.href;
			} else {
				return "#" + image.id.validValue;
			};
		} else {
			for (const [key, value] of this.reservedIds.entries()) {
				if (value === imgid) return "#" + key;
			};
			return "";
		};
	};

	getImgid(href: string | null) {
		if (!href) {
			return "";
		};

		const isExternal = !href.startsWith("#");
		const id = isExternal ? href : href.slice(1);

		let imgid = this.reservedIds.get(id);
		if (imgid !== undefined) {
			return imgid;
		} else if (isExternal) {
			return this.addAsRef(href);
		} else {
			imgid = self.crypto.randomUUID();
			this.reservedIds.set(id, imgid);
			return imgid;
		};
	}

	collectActiveImages() {
		this.activeIds = new Set<string>(this.trackedIds);

		for (const view of Object.values(editorState.views)) {
			view.state.doc.descendants((node) => {
				if (node.attrs.imgid) {
					this.activeIds.add(node.attrs.imgid);
				};
			});
		};
	}

	*getActiveImages(): Generator<ImageSpec, void, unknown> {
		for (const id of this.activeIds) {
			const image = this.allImages.get(id);
			if (image && image.kind === "internal") {
				yield image;
			};
		};
	}

	trackImgid(imgid: string) {
		if (this.allImages.has(imgid)) {
			this.trackedIds.add(imgid);
		};
	}

	untrackImgid(imgid: string) {
		this.trackedIds.delete(imgid);
	}

	getTrackedImgids() {
		return this.trackedIds;
	}

	clear() {
		this.allImages.clear();
		this.activeIds.clear();
		this.reservedIds.clear();
		this.trackedIds.clear();
	}
};

const imageStore = reactive(new ImageStore());

export default imageStore;

export type { ImageSpec, ExternalImageSpec };