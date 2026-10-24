import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentElement } from "@/lib/canvas/types";
import { HttpTranscriptConnector } from "../transcript/connector";
import { createClipSoundPlugin } from "../transcript/plugins/clip-sound";
import type { AssetResult } from "../types";
import { mockGatewaySequence } from "./_gateway-mock";
import { dependenciesOf } from "./_state-ctx";

const element = (id: string, type: ContentElement["type"]): ContentElement => ({
	id,
	type,
	children: [{ id: `${id}-t`, type, text: "" }],
});

describe("clip-sound plugin", () => {
	const plugin = createClipSoundPlugin();

	it("depends on the clip it captions", () => {
		const video = element("vid", "video");
		expect(dependenciesOf(plugin, video)).toEqual({ "the clip": "vid" });
	});

	const before = (dependencies: Record<string, AssetResult>) => {
		if (!plugin.beforeGenerate) throw new Error("no beforeGenerate");
		return plugin.beforeGenerate({ prompt: "" }, { dependencies });
	};

	it("transcribes the video's sound, or the music's", () => {
		expect(
			before({ "the clip": { videoUrl: "v.mp4", durationSec: 5 } }),
		).toEqual({ prompt: "", mediaUrl: "v.mp4" });
		expect(
			before({ "the clip": { audioUrl: "m.mp3", durationSec: 5 } }),
		).toEqual({ prompt: "", mediaUrl: "m.mp3" });
	});

	it("fails when there is nothing to listen to", () => {
		expect(() => before({})).toThrow(/no sound/);
	});
});

describe("HttpTranscriptConnector", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("reads the word timings from the bundle, with no media of its own", async () => {
		const words = [{ text: "hi", start: 0, end: 0.4 }];
		mockGatewaySequence([
			{ submitStatus: "pending" },
			{
				pollStatus: "completed",
				result: {
					id: "t1",
					type: "transcript",
					provider: "elevenlabs",
					result: { timestamps: "timestamps.json" },
					metadata: { durationSec: 3 },
				},
			},
			{ payload: words },
		]);

		const result = await new HttpTranscriptConnector({
			model: { provider: "openslop", model: "Slop STT v1" },
		}).generate({ prompt: "", mediaUrl: "https://blob/v.mp4" });

		expect(result).toEqual({ durationSec: 3, textTimestamps: words });
	});
});
