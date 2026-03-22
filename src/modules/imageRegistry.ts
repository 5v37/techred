import { reactive } from "vue";

import { base64toData, formatBytes, imageFileType } from "@/modules/utils";
import { validateId, generateUniqueFileName } from "@/modules/idManager";
import { invalidId, openFileError, saveFileError, saveFileInfo } from "@/modules/notifications";
import editorState from "@/modules/editorState";
import { openFileDialog, saveFileDialog } from "@/modules/fileDialog";

type ImageSpec = {
	kind: "internal",
	imgid: string,
	type: string,
	url: string,
	data: ArrayBuffer,
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

class ImageRegistry {
	private allImages = new Map<string, ImageSpec | ExternalImageSpec>();
	private activeIds = new Set<string>();
	private reservedIds = new Map<string, string>();
	private trackedIds = new Set<string>();

	addAsArrayBuffer(data: ArrayBuffer, mimeType: `${string}/${string}`, name: string) {
		const imgid = self.crypto.randomUUID();
		const validId = generateUniqueFileName(name, mimeType);
		const blob = new Blob([data], { type: mimeType });
		const url = URL.createObjectURL(blob);

		if (validId !== name) {
			invalidId(name, validId);
		};

		this.allImages.set(imgid, {
			kind: "internal",
			imgid: imgid,
			url: url,
			type: mimeType,
			data,
			id: {
				validValue: validId,
				invalid: false,
				draftValue: validId,
				error: ""
			}
		});

		return imgid;
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
		if (content) {
			const data = base64toData(content);
			const mimeType = type || imageFileType(data.buffer);
			if (mimeType) {
				let imgid = this.reservedIds.get(id);
				if (imgid) {
					this.reservedIds.delete(id);
				} else {
					imgid = self.crypto.randomUUID();
				};
				const idValidation = validateId(id, ids, false);
				const blob = new Blob([data], { type: mimeType });
				const url = URL.createObjectURL(blob);

				this.allImages.set(imgid, {
					kind: "internal",
					imgid: imgid,
					url: url,
					type: mimeType,
					data: data.buffer,
					id: {
						validValue: id,
						invalid: idValidation.invalid,
						draftValue: id,
						error: idValidation.error
					}
				});
				return imgid;
			};
		};
	}

	async importFromDialog() {
		try {
			const vfile = await openFileDialog("Изображения", ["png", "jpg", "jpeg"]);
			if (vfile) {
				const fileData = await vfile.read();
				const fileType = imageFileType(fileData);
				if (!fileType) {
					throw new Error("Неподдерживаемый формат изображения");
				};

				return this.addAsArrayBuffer(fileData, fileType, vfile.name);
			};
		} catch (error) {
			openFileError(error);
		};
	}

	async exportToDialog(imgid: string) {
		try {
			const image = this.allImages.get(imgid);
			if (image && image.kind === "internal") {
				const vfile = await saveFileDialog("Изображения", ["png", "jpg", "jpeg"], image.id.validValue);
				if (vfile) {
					await vfile.write(image.data);
					saveFileInfo();
				};
			};
		} catch (error) {
			saveFileError(error);
		};
	}

	getSrc(imgid: string) {
		const image = this.allImages.get(imgid);
		if (image) {
			if (image.kind === "external") {
				return image.href;
			} else {
				return image.url;
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
	}

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

	getInfo(imgid: string) {
		const image = this.allImages.get(imgid);
		if (image) {
			if (image.kind === "external") {
				return `(Ссылка: ${image.href})`;
			} else {
				return `(Файл: ${image.id.validValue} | ${formatBytes(image.data.byteLength)})`;
			};
		} else {
			return "";
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

	* getActiveImages(): Generator<ImageSpec, void, unknown> {
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
		for (const image of this.allImages.values()) {
			if (image.kind === "internal") {
				URL.revokeObjectURL(image.url);
			};
		};
		this.allImages.clear();
		this.activeIds.clear();
		this.reservedIds.clear();
		this.trackedIds.clear();
	}
};

const imageRegistry = reactive(new ImageRegistry());

export default imageRegistry;
export type { ImageSpec, ExternalImageSpec };