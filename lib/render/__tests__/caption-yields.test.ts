import { describe, expect, it } from "vitest";
import { shownSpans, yieldsAt } from "../caption-yields";

describe("shownSpans", () => {
	it("keeps a span no yield touches", () => {
		expect(shownSpans(0, 4, [])).toEqual([[0, 4]]);
	});

	it("cuts out every yield, overlapping or out of order", () => {
		expect(
			shownSpans(0, 10, [
				[6, 8],
				[1, 3],
				[2, 4],
			]),
		).toEqual([
			[0, 1],
			[4, 6],
			[8, 10],
		]);
	});

	it("shows nothing of a span a yield covers", () => {
		expect(shownSpans(1, 2, [[0, 3]])).toEqual([]);
	});
});

describe("yieldsAt", () => {
	it("yields from a span's start up to its end", () => {
		expect(yieldsAt([[1, 2]], 1)).toBe(true);
		expect(yieldsAt([[1, 2]], 2)).toBe(false);
	});
});
