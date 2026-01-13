import editorState from "@/modules/editorState";

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
	const match = input.match(/(\d+)$/);
	if (!match) return undefined;

	const ids = getIds();
	const prefix = input.slice(0, match.index);
	const numberStr = match[0];

	let num = BigInt(numberStr);
	let newNumberStr: string, newId: string;
	do {
		num = num + 1n;
		newNumberStr = num.toString();

		if (newNumberStr.length < numberStr.length) {
			newNumberStr = newNumberStr.padStart(numberStr.length, "0");
		};
		newId = prefix + newNumberStr;
	} while (ids.has(newId));

	return newId;
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