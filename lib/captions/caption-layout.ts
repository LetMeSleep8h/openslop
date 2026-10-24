import sortedLastIndex from "lodash/sortedLastIndex";
import type { CaptionReveal } from "./caption-style";

export type CaptionWord = {
	text: string;
	active: boolean;
	/** Not yet spoken under `word` reveal; it holds its space but stays unseen. */
	hidden: boolean;
};

/** Index of the word being spoken at `seconds`, or -1 before the first one. */
export function activeWordIndex(startTimes: number[], seconds: number): number {
	return sortedLastIndex(startTimes, seconds) - 1;
}

/** A typed line (shared line id) stays whole; other words run `maxWordsPerLine` to a line from the last typed one. */
export function captionLineAt(
	wordCount: number,
	wordIndex: number,
	maxWordsPerLine: number,
	lineIds: readonly (number | undefined)[] = [],
): { start: number; end: number } {
	if (wordIndex < 0 || wordIndex >= wordCount) return { start: 0, end: 0 };
	const id = lineIds[wordIndex];
	const sameLine = (at: number) => lineIds[at] === id;
	let start = wordIndex;
	while (start > 0 && sameLine(start - 1)) start -= 1;
	const perLine = Math.max(1, Math.floor(maxWordsPerLine));
	if (id === undefined)
		start += Math.floor((wordIndex - start) / perLine) * perLine;
	const limit = id === undefined ? start + perLine : wordCount;
	let end = start;
	while (end < Math.min(limit, wordCount) && sameLine(end)) end += 1;
	return { start, end };
}

/**
 * The words on the line `wordIndex` sits on. The whole line is always returned
 * so its footprint never shifts mid-reveal.
 */
export function captionWordsAt(
	words: readonly string[],
	wordIndex: number,
	{
		maxWordsPerLine,
		reveal,
	}: { maxWordsPerLine: number; reveal: CaptionReveal },
): CaptionWord[] {
	return wordsOnLine(
		words,
		wordIndex,
		captionLineAt(words.length, wordIndex, maxWordsPerLine),
		reveal,
	);
}

export function wordsOnLine(
	words: readonly string[],
	wordIndex: number,
	{ start, end }: { start: number; end: number },
	reveal: CaptionReveal,
): CaptionWord[] {
	const activeInLine = wordIndex - start;
	return words.slice(start, end).map((text, index) => ({
		text,
		active: index === activeInLine,
		hidden: reveal === "word" && index > activeInLine,
	}));
}

/** Every line the words fall into, in order, as the player shows them. */
export function captionLines<T extends { line?: number }>(
	words: readonly T[],
	maxWordsPerLine: number,
): T[][] {
	const lineIds = words.map(({ line }) => line);
	const lines: T[][] = [];
	for (let at = 0; at < words.length; ) {
		const { end } = captionLineAt(words.length, at, maxWordsPerLine, lineIds);
		lines.push(words.slice(at, end));
		at = end;
	}
	return lines;
}
