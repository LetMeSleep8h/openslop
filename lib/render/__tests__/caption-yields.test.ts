import { describe, expect, it } from "vitest";
import type { ResolvedCaptions } from "../types";
import { layoutOf, resolvedElement } from "./_layout";

const captions = (ownerId: string): ResolvedCaptions => ({
	ownerId,
	firstWord: 0,
	words: [{ text: "hi", start: 0, end: 1 }],
});

describe("caption yields", () => {
	it("hides a video's captions while speech over it is captioned", () => {
		const layout = layoutOf([
			resolvedElement("vid", "video", {
				durationSec: 10,
				captions: captions("vid:captions"),
			}),
			resolvedElement("nar", "narration", {
				durationSec: 3,
				captions: captions("nar"),
			}),
		]);
		const [video] = layout.series;
		expect(video.captionsYieldSec).toEqual([[0, 3]]);
		expect(layout.sequences.narration?.[0].captionsYieldSec).toBeUndefined();
	});

	it("hides music's captions under a captioned video, and nothing under one without words", () => {
		const music = resolvedElement("mus", "music", {
			durationSec: 8,
			captions: captions("mus:captions"),
		});
		const quiet = layoutOf([
			music,
			resolvedElement("vid", "video", { durationSec: 8 }),
		]);
		expect(quiet.sequences.music?.[0].captionsYieldSec).toBeUndefined();

		const spoken = layoutOf([
			music,
			resolvedElement("vid", "video", {
				durationSec: 8,
				captions: captions("vid:captions"),
			}),
		]);
		expect(spoken.sequences.music?.[0].captionsYieldSec).toEqual([[0, 8]]);
	});
});
