import editorState from "@/modules/editorState";
import { resolveFileExtension } from "./utils";

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

export function generateUniqueFileName(originalName: string, mimeType: MIMEType): string {
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

let idCache: Set<string> | undefined = undefined;
let idKey: string | undefined = undefined;

function clearIdCache() {
	idCache = undefined;
	idKey = undefined;
}

function getIds(exclude?: string): Set<string> {
	if (!idCache || exclude !== idKey) {
		idKey = exclude;
		idCache = editorState.getIds(false, exclude);
	};
	return idCache;
}

export { NCNameFilter, validateId, incrementId, getIds, clearIdCache };