import { Mark } from "prosemirror-model";
import { MarkType, ResolvedPos } from "prosemirror-model";

export function isSameMark($from: ResolvedPos, $to: ResolvedPos, mark: Mark | MarkType) {
	let isSame = true;
	$to.doc.nodesBetween($from.pos, $to.pos, (node) => {
		if (node.isInline && !mark.isInSet(node.marks)) {
			isSame = false;
		}
		return isSame;
	});
	return isSame;
}

export function marksInPos($pos: ResolvedPos) {
	const parent = $pos.parent;
	const index = $pos.index();

	if (parent.content.size == 0) {
		return Mark.none;
	};
	if ($pos.textOffset) {
		return parent.child(index).marks;
	};

	let main = parent.maybeChild(index - 1);
	let other = parent.maybeChild(index);

	if (!main) {
		[main, other] = [other, main];
	};

	while (main && main.isBlock) {
		main = main.lastChild;
		other = null;
	};

	if (!main) {
		return Mark.none;
	};

	const marks = new Set<Mark>();
	for (const mark of main.marks) {
		if (mark.type.spec.inclusive === false && (!other || !mark.isInSet(other.marks))) {
			continue;
		};
		marks.add(mark);
	};

	if (other) {
		for (const mark of other.marks) {
			if (mark.type.spec.inclusive === false && (!main || !mark.isInSet(main.marks))) {
				continue;
			};
			marks.add(mark);
		};
	};
	return Mark.setFrom(Array.from(marks));
}

export function markBoundaries($pos: ResolvedPos, markType: MarkType) {
	const { parent, parentOffset } = $pos;
	const start = parentOffset === 0 ? parent.childAfter(parentOffset) : parent.childBefore(parentOffset);
	if (!start.node) return;

	const mark = start.node.marks.find((mark) => mark.type === markType);
	if (!mark) return;

	let startIndex = start.index;
	let from = $pos.start() + start.offset;
	let endIndex = startIndex + 1;
	let to = from + start.node.nodeSize;
	while (startIndex > 0 && mark.isInSet(parent.child(startIndex - 1).marks)) {
		startIndex -= 1;
		from -= parent.child(startIndex).nodeSize;
	}
	while (endIndex < parent.childCount && mark.isInSet(parent.child(endIndex).marks)) {
		to += parent.child(endIndex).nodeSize;
		endIndex += 1;
	}
	return { from, to, mark };
}

const isPunctuation = (char: string) => /\p{P}/u.test(char);
const isWhitespace = (c: string) => /\p{Z}/u.test(c);

export function wordBoundaries($pos: ResolvedPos, markType?: MarkType, active?: boolean) {
	const { parent, parentOffset } = $pos;

	if (!parent.inlineContent || !parent.isTextblock || !parent.textContent) {
		return { from: $pos.pos, to: $pos.pos, canMarkup: false };
	}

	const text = parent.textContent;
	const nodeOffset = $pos.start();

	let segmentFrom = 0;
	let segmentTo = text.length;

	if (markType && active) {
		const position = markBoundaries($pos, markType);
		if (position) {
			segmentFrom = position.from - nodeOffset;
			segmentTo = position.to - nodeOffset;
		};
	};

	let enough = false;
	const linkTypes = [parent.type.schema.marks.a, parent.type.schema.marks.note];
	parent.nodesBetween(segmentFrom, segmentTo, (node, pos) => {
		if (!enough) {
			for (const mark of node.marks) {
				if (linkTypes.includes(mark.type)) {
					const linkFrom = pos;
					const linkTo = pos + node.nodeSize;
					if (parentOffset >= linkFrom && (parentOffset < linkTo || linkTo === text.length)) {
						const position = markBoundaries($pos.doc.resolve(nodeOffset + linkTo), mark.type);
						if (position) {
							segmentFrom = position.from - nodeOffset;
							segmentTo = position.to - nodeOffset;
							enough = true;
						};
					} else if (parentOffset >= linkTo) {
						segmentFrom = Math.max(linkTo, segmentFrom);
					} else if (parentOffset <= linkFrom) {
						segmentTo = Math.min(linkFrom, segmentTo);
						enough = true;
					};
					break;
				};
			};
		};
		return !enough;
	});

	let atWhitespace = isWhitespace(text[parentOffset]);
	if (atWhitespace && parentOffset - 1 >= segmentFrom && !isWhitespace(text[parentOffset - 1])) {
		atWhitespace = false;
	}

	let wordStart = parentOffset;
	let wordEnd = parentOffset;

	while (wordStart > segmentFrom && isWhitespace(text[wordStart - 1]) === atWhitespace) {
		wordStart--;
	};
	while (wordEnd < segmentTo && isWhitespace(text[wordEnd]) === atWhitespace) {
		wordEnd++;
	}

	let canMarkup = !atWhitespace;
	if (canMarkup) {
		if (markType && active) {
			while (wordStart > segmentFrom && isWhitespace(text[wordStart - 1])) {
				wordStart--;
			};
			while (wordEnd < segmentTo && isWhitespace(text[wordEnd])) {
				wordEnd++;
			};
		} else {
			const wordText = text.slice(wordStart, wordEnd);
			const trimmed = trimPunctuation(wordText);
			if (trimmed) {
				const trimEnd = (wordText.length - trimmed.end);
				if (parentOffset > wordEnd - trimEnd) {
					wordStart = wordEnd - trimEnd;
					canMarkup = false;
				} else if (parentOffset < wordStart + trimmed.start) {
					wordEnd = wordStart + trimmed.start;
					canMarkup = false;
				} else {
					wordStart += trimmed.start;
					wordEnd -= trimEnd;
				};
			};
		};
	};

	if (canMarkup && markType && !active) {
		let searchWordStart = wordStart;
		while (searchWordStart > segmentFrom && isWhitespace(text[searchWordStart - 1])) {
			searchWordStart--;
		};
		let tempNode = parent.nodeAt(searchWordStart > segmentFrom ? searchWordStart - 1 : segmentFrom);
		if (tempNode && markType.isInSet(tempNode.marks)) {
			wordStart = searchWordStart;
		};

		let searchWordEnd = wordEnd;
		while (searchWordEnd < segmentTo && isWhitespace(text[searchWordEnd])) {
			searchWordEnd++;
		};
		tempNode = parent.nodeAt(searchWordEnd);
		if (tempNode && markType.isInSet(tempNode.marks)) {
			wordEnd = searchWordEnd;
		};
	};

	return { from: nodeOffset + wordStart, to: nodeOffset + wordEnd, canMarkup };
}

const pairs = new Map<string, string>();
// скобки
pairs.set("(", ")");
pairs.set("[", "]");
pairs.set("{", "}");
pairs.set("<", ">");
pairs.set("⟨", "⟩");
pairs.set("/", "/");
// кавычки
pairs.set("«", "»");
pairs.set("„", "“");
pairs.set("“", "”");
pairs.set("‘", "’");
pairs.set("'", "'");
pairs.set('"', '"');

function trimPunctuation(str: string) {
	let start = 0;
	let end = str.length;

	while (start < end && isPunctuation(str[start])) {
		const pairChar = pairs.get(str[start]);
		if (pairChar) {
			let searchEnd = end;
			while (start < searchEnd) {
				if (str[searchEnd - 1] === pairChar) {
					return (start === 0 && searchEnd === str.length) ? undefined : { start, end: searchEnd };
				};
				if (!isPunctuation(str[searchEnd - 1])) break;
				searchEnd--;
			};

			if (start === searchEnd) return undefined;
		};

		start++;
	}

	while (start < end && isPunctuation(str[end - 1])) {
		end--;
	};

	return (start === end || (start === 0 && end === str.length)) ? undefined : { start, end };
}