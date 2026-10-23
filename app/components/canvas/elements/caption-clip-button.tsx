"use client";

import { Button } from "@/components/ui/button";
import type { ContentElement } from "@/lib/canvas/types";
import { isGenerationActive } from "@/lib/generation/snapshots";
import { useClipCaptions } from "../hooks/use-clip-captions";
import { useElementGeneration } from "./element-generation-context";
import { GENERATE_ICON } from "./generate-button";

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
	const { status, error, hasResult, staleReason, generate } =
		useClipCaptions(element);
	const active = isGenerationActive(status);
	if (!clipReady || (hasResult && !staleReason && !error && !active))
		return null;

	return (
		<Button
			type="button"
			variant="generate"
			size="sm"
			className="shrink-0"
			disabled={active}
			onMouseDown={(e) => e.preventDefault()}
			onClick={generate}
			tooltip={
				error ??
				staleReason ??
				"Transcribe what this clip says or sings into captions"
			}
		>
			{GENERATE_ICON[status]}
			{captionLabel(active, error, hasResult)}
		</Button>
	);
}
