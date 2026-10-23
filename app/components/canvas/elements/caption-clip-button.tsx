"use client";

import type { ContentElement } from "@/lib/canvas/types";
import { isGenerationActive } from "@/lib/generation/snapshots";
import { useGenerate } from "../hooks/use-generate";
import { useElementGeneration } from "./element-generation-context";
import { GenerateButton } from "./generate-button";

function captionLabel(
	active: boolean,
	error: string | null,
	hasResult: boolean,
) {
	if (active) return "Captioning…";
	if (error) return "Retry captions";
	return hasResult ? "Recaption" : "Caption";
}

/** Transcribing is a paid generation, so it sits with Generate, and only while the clip's captions are missing, out of date or failed. */
export function CaptionClipButton({ element }: { element: ContentElement }) {
	const { hasResult: clipReady } = useElementGeneration();
	const { status, error, hasResult, staleReason, generate } = useGenerate(
		element,
		"captions",
	);
	const active = isGenerationActive(status);
	if (!clipReady || (hasResult && !staleReason && !error && !active))
		return null;

	return (
		<GenerateButton
			status={status}
			hasResult={hasResult}
			disabled={active}
			onGenerate={generate}
			label={captionLabel(active, error, hasResult)}
			tooltip={
				error ??
				staleReason ??
				"Transcribe what this clip says or sings into captions"
			}
		/>
	);
}
