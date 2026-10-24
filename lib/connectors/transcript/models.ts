import type { ModelRef, ModelsByProvider } from "../types";
import { CARTESIA_TRANSCRIPT_MODELS } from "./cartesia/models";
import { ELEVENLABS_TRANSCRIPT_MODELS } from "./elevenlabs/models";
import { OPENSLOP_TRANSCRIPT_MODELS } from "./openslop/models";

export const TRANSCRIPT_MODELS = {
	openslop: OPENSLOP_TRANSCRIPT_MODELS,
	cartesia: CARTESIA_TRANSCRIPT_MODELS,
	elevenlabs: ELEVENLABS_TRANSCRIPT_MODELS,
} satisfies ModelsByProvider;

export const DEFAULT_TRANSCRIPT_MODEL: ModelRef = {
	provider: "openslop",
	model: "Slop STT v1",
};
