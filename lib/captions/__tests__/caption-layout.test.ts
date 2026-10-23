import { describe, expect, it } from "vitest";
import {
	activeWordIndex,
	captionLineAt,
	captionWordsAt,
} from "../caption-layout";

const WORDS = ["one", "two", "three", "four", "five"];
const text = (words: { text: string }[]) => words.map((w) => w.text);
const shown = (words: { text: string; hidden: boolean }[]) =>
	words.filter((w) => !w.hidden).map((w) => w.text);
const activeText = (words: { text: string; active: boolean }[]) =>
	words.filter((w) => w.active).map((w) => w.text);

describe("activeWordIndex", () => {
	const startTimes = [0, 1, 2];

	it("is -1 before the first word", () => {
		expect(activeWordIndex(startTimes, -0.5)).toBe(-1);
	});

	it("holds a word until the next one starts", () => {
		expect(activeWordIndex(startTimes, 0)).toBe(0);
		expect(activeWordIndex(startTimes, 0.99)).toBe(0);
		expect(activeWordIndex(startTimes, 1)).toBe(1);
		expect(activeWordIndex(startTimes, 99)).toBe(2);
	});
});

describe("captionWordsAt", () => {
	const line = { maxWordsPerLine: 2, reveal: "line" } as const;
	const word = { maxWordsPerLine: 2, reveal: "word" } as const;

	it("is empty outside the word range", () => {
		expect(captionWordsAt(WORDS, -1, line)).toEqual([]);
		expect(captionWordsAt(WORDS, WORDS.length, line)).toEqual([]);
	});

	it("shows the whole line the word sits on", () => {
		expect(text(captionWordsAt(WORDS, 2, line))).toEqual(["three", "four"]);
	});

	it("builds the line up to the current word", () => {
		expect(shown(captionWordsAt(WORDS, 2, word))).toEqual(["three"]);
		expect(shown(captionWordsAt(WORDS, 3, word))).toEqual(["three", "four"]);
	});

	it("keeps unspoken words in the line so it never reflows", () => {
		expect(text(captionWordsAt(WORDS, 2, word))).toEqual(["three", "four"]);
		expect(captionWordsAt(WORDS, 2, word).map((w) => w.hidden)).toEqual([
			false,
			true,
		]);
	});

	it("shows the whole line under line reveal", () => {
		expect(captionWordsAt(WORDS, 2, line).every((w) => !w.hidden)).toBe(true);
	});

	it("marks only the current word active", () => {
		expect(activeText(captionWordsAt(WORDS, 3, line))).toEqual(["four"]);
	});

	it("keeps a trailing partial line intact", () => {
		expect(text(captionWordsAt(WORDS, 4, line))).toEqual(["five"]);
	});

	it("falls back to one word per line for degenerate limits", () => {
		const words = captionWordsAt(WORDS, 3, {
			maxWordsPerLine: 0,
			reveal: "line",
		});
		expect(text(words)).toEqual(["four"]);
	});
});

describe("captionLineAt", () => {
	it("spans the run of words the index sits in", () => {
		expect(captionLineAt(10, 4, 3)).toEqual({ start: 3, end: 6 });
	});

	it("ends the last line at the last word", () => {
		expect(captionLineAt(7, 6, 3)).toEqual({ start: 6, end: 7 });
	});
});

describe("captionLineAt with typed lines", () => {
	const ids = [7, 7, 7, 7, 7, undefined, undefined, undefined, undefined, 9, 9];

	it("keeps a typed line whole, however long", () => {
		expect(captionLineAt(ids.length, 2, 3, ids)).toEqual({ start: 0, end: 5 });
	});

	it("counts fixed-size lines from the end of the typed line before", () => {
		expect(captionLineAt(ids.length, 5, 3, ids)).toEqual({ start: 5, end: 8 });
		expect(captionLineAt(ids.length, 8, 3, ids)).toEqual({ start: 8, end: 9 });
	});

	it("ends untouched lines where the next typed line starts", () => {
		expect(captionLineAt(ids.length, 10, 3, ids)).toEqual({
			start: 9,
			end: 11,
		});
	});
});
