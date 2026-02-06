import editorState from "@/modules/editorState";
import { resolveFileExtension } from "@/modules/utils";
import imageStore from "@/modules/imageStore";

const NCNameFilter = { pattern: /^[\p{L}_][\p{L}\p{N}_.-]*$/u, validateOnly: true };

function validateId(idValue: string, ids: Set<string>, allowEmpty = true) {
	if (!allowEmpty && !idValue) {
		return { invalid: true, error: "Значение не заполнено" };
	};
	if (idValue && !NCNameFilter.pattern.test(idValue)) {
		return { invalid: true, error: "Значение некорректно" };
	};
	if (ids.has(idValue)) {
		return { invalid: true, error: "Значение не уникально" };
	};
	return { invalid: false, error: "" };
}

function incrementId(input: string): string | undefined {
	const match = input.match(/(.*)(\d+)(.*)/);
	if (!match) return undefined;

	const prefix = match[1];
	const numberStr = match[2];
	const suffix = match[3];
	const ids = getIds();

	let num = BigInt(numberStr);
	let newNumberStr: string, newId: string;
	do {
		num = num + 1n;
		newNumberStr = num.toString();

		if (newNumberStr.length < numberStr.length) {
			newNumberStr = newNumberStr.padStart(numberStr.length, "0");
		};
		newId = prefix + newNumberStr + suffix;
	} while (ids.has(newId));

	return newId;
}

function generateUniqueFileName(originalName: string, mimeType: MIMEType): string {
	const file = resolveFileExtension(originalName, mimeType);

	let cleanName = file.name.trim()
		.replace(/\p{Z}*\p{Pd}\p{Z}*/gu, "-")
		.replace(/[^\p{L}\p{N}_.-]+/gu, "_");

	if (!cleanName) {
		cleanName = "img_0";
	} else if (!/^[\p{L}_]/gu.test(cleanName)) {
		cleanName = "_" + cleanName;
	};

	const ext = file.ext.trim();
	const baseName = `${cleanName}.${ext}`;
	const ids = getIds();

	if (ids.has(baseName)) {
		return incrementId(baseName) || incrementId(`${cleanName}_0.${ext}`)!;
	} else {
		return baseName;
	};
}

function getIds(targetId?: string, skipImages = false) {
	let targetCount = 0;
	const result = new Set<string>();
	const processId = (id: string) => {
		if (id === targetId) {
			targetCount++;
		} else if (id !== "") {
			result.add(id);
		};
	};

	const usedImgids = imageStore.getTrackedImgids();
	if (!skipImages) {
		for (const imgId of usedImgids) {
			processId(imageStore.getId(imgId));
		};
	};

	for (const view of Object.values(editorState.views)) {
		view.state.doc.descendants((node) => {
			if (node.attrs.id) {
				processId(node.attrs.id);
			};
			if (!skipImages && node.attrs.imgid && !usedImgids.has(node.attrs.imgid)) {
				processId(imageStore.getId(node.attrs.imgid));
				usedImgids.add(node.attrs.imgid);
			};
		});
	};

	if (targetCount > 1 && targetId) {
		result.add(targetId);
	};

	return result;
}

export { NCNameFilter, validateId, incrementId, getIds, generateUniqueFileName };