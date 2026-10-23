import { describe, expect, it } from "vitest";
import { layoutOf, resolvedElement } from "@/lib/render/__tests__/_layout";
import { captionClips } from "../caption-clips";

describe("captionClips", () => {
	it("lists each clip with words to caption once, in the order it plays", () => {
		const layout = layoutOf([
			resolvedElement("vid", "video", { durationSec: 6 }),
			resolvedElement("mus", "music", { durationSec: 4, loops: 2 }),
			resolvedElement("nar", "narration", { durationSec: 2 }),
			resolvedElement("img", "image"),
			resolvedElement("sfx", "sound"),
		]);
		expect(
			captionClips(layout).map(({ element, source }) => [element.id, source]),
		).toEqual([
			["vid", "transcript"],
			["nar", "voice"],
			["mus", "transcript"],
		]);
	});
});
