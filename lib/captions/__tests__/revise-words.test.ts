import { describe, expect, it } from "vitest";
import type { TextTimestamp } from "@/lib/connectors/types";
import { captionLineAt } from "../caption-layout";
import { reviseWords } from "../revise-words";

const song = ["the", "quick", "fox", "ran", "over", "the", "lazy", "dog"].map(
	(text, at) => ({ text, start: at, end: at + 1 }),
);

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
