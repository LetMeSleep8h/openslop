import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpTranscriptConnector } from "../transcript/connector";
import { mockGatewaySequence } from "./_gateway-mock";

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
