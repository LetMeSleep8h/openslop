import { describe, expect, it } from "vitest";
import type { TextTimestamp } from "@/lib/connectors/types";
import { captionLineAt } from "../caption-layout";
import {
	editCaptions,
	removeCaptions,
	resetCaptions,
	reviseWords,
	withTranscript,
} from "../revise-words";

const song = ["the", "quick", "fox", "ran", "over", "the", "lazy", "dog"].map(
	(text, at) => ({ text, start: at, end: at + 1 }),
);

describe("editCaptions", () => {
	const generated = { durationSec: 8, textTimestamps: song };

	it("keeps the words as generated through every edit, and resets to them", () => {
		const once = editCaptions(generated, 0, 2, "a slow");
		const twice = editCaptions(once, 2, 4, "fox ran");
		expect(twice.generatedTextTimestamps).toBe(song);
		expect(resetCaptions(twice)).toEqual(generated);
	});

	it("refuses to reset captions nobody edited", () => {
		expect(() => resetCaptions(generated)).toThrow();
	});

	it("removes the words and their edits, and keeps the rest of the result", () => {
		const edited = editCaptions(generated, 0, 2, "a slow");
		expect(removeCaptions(edited)).toEqual({ durationSec: 8 });
		expect(() => removeCaptions({ durationSec: 8 })).toThrow();
	});

	it("lets a transcript replace the words, edits and all", () => {
		const edited = editCaptions(generated, 0, 2, "a slow");
		const heard = [{ text: "hey", start: 0, end: 1 }];
		expect(
			withTranscript(edited, { durationSec: 8, textTimestamps: heard }),
		).toEqual({ durationSec: 8, textTimestamps: heard });
	});
});

describe("reviseWords", () => {
	it("lays the typed words over the line's span, each timed by its length", () => {
		expect(reviseWords(song, 0, 2, "a slow")).toEqual([
			{ text: "a", start: 0, end: 0.4, line: 0 },
			{ text: "slow", start: 0.4, end: 2, line: 0 },
			...song.slice(2),
		]);
	});

	it("names a line by when it starts, and keeps that name when it is edited again", () => {
		const once = reviseWords(song, 4, 8, "over the dog");
		expect(once.slice(4).map((word) => word.line)).toEqual([4, 4, 4]);
		const twice = reviseWords(once, 4, 7, "over a lazy dog");
		expect(twice.slice(4).map((word) => word.line)).toEqual([4, 4, 4, 4]);
	});

	it("drops a line cleared of its words", () => {
		expect(reviseWords(song, 0, 4, " ")).toEqual(song.slice(4));
	});
});

describe("a typed line on screen", () => {
	const lineOf = (timestamps: TextTimestamp[], at: number) => {
		const { start, end } = captionLineAt(
			timestamps.length,
			at,
			4,
			timestamps.map((word) => word.line),
		);
		return timestamps.slice(start, end).map((word) => word.text);
	};

	it("shows every word typed, and leaves the lines after it as they were", () => {
		const edited = reviseWords(song, 0, 4, "the quick brown fox ran");
		expect(lineOf(edited, 0)).toEqual(["the", "quick", "brown", "fox", "ran"]);
		expect(lineOf(edited, 5)).toEqual(["over", "the", "lazy", "dog"]);
	});

	it("pulls nothing up from the next line when words are deleted", () => {
		const edited = reviseWords(song, 0, 4, "the fox");
		expect(lineOf(edited, 0)).toEqual(["the", "fox"]);
		expect(lineOf(edited, 2)).toEqual(["over", "the", "lazy", "dog"]);
	});
});
