import type { ModelRef, ModelsByProvider } from "../types";
import { CARTESIA_TRANSCRIPT_MODELS } from "./cartesia/models";
import { OPENSLOP_TRANSCRIPT_MODELS } from "./openslop/models";

export const TRANSCRIPT_MODELS = {
	openslop: OPENSLOP_TRANSCRIPT_MODELS,
	cartesia: CARTESIA_TRANSCRIPT_MODELS,
} satisfies ModelsByProvider;

export const DEFAULT_TRANSCRIPT_MODEL: ModelRef = {
	provider: "openslop",
	model: "Slop Transcript v1",
};
