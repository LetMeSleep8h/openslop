import { describe, expect, it } from "vitest";
import { MODEL_GROUPS, groupFor, groupModels } from "../model-groups";
import { MODELS } from "../models";
import { CONNECTOR_TYPES } from "../types";

describe("MODEL_GROUPS", () => {
	it("covers every connector type exactly once", () => {
		const covered = MODEL_GROUPS.flatMap((group) => group.types);
		expect([...covered].sort()).toEqual([...CONNECTOR_TYPES].sort());
	});

	// One control sets the whole group, so every type in it must run on the
	// same providers, each writing the pick only where its catalog offers it.
	it("only groups types served by the same providers", () => {
		for (const { key, types } of MODEL_GROUPS) {
			const [first, ...rest] = types;
			for (const type of rest) {
				expect(
					{ key, providers: Object.keys(MODELS[type]) },
					`${key} spans providers`,
				).toEqual({ key, providers: Object.keys(MODELS[first]) });
			}
		}
	});

	it("leaves a type out of a pick its catalog does not offer", () => {
		expect(
			groupModels(["voice", "tts", "transcript"], {
				provider: "cartesia",
				model: "Sonic 3.6",
			}),
		).toEqual({
			voice: { provider: "cartesia", model: "Sonic 3.6" },
			tts: { provider: "cartesia", model: "Sonic 3.6" },
		});
	});

	it("finds the group a type belongs to", () => {
		expect(groupFor("image").key).toBe("images");
		expect(groupFor("video").key).toBe("videos");
		expect(groupFor("llm").key).toBe("text");
	});
});
