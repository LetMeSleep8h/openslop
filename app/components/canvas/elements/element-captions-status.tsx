"use client";

import type { ComponentProps } from "react";
import { Captions } from "@/components/ui/icon";
import type { ContentElement } from "@/lib/canvas/types";
import { isGenerationActive } from "@/lib/generation/snapshots";
import { IconChip } from "../../models/icon-chip";
import { useGenerate } from "../hooks/use-generate";
import { useElementGeneration } from "./element-generation-context";

type Status = Pick<ComponentProps<typeof IconChip>, "label" | "variant">;

function transcriptStatus({
	status,
	error,
	hasResult,
	staleReason,
}: ReturnType<typeof useGenerate>): Status {
	if (isGenerationActive(status))
		return { label: "Captioning…", variant: "subtle" };
	if (error)
		return { label: `Captions failed: ${error}`, variant: "destructive" };
	if (staleReason)
		return {
			label: `Captions out of date: ${staleReason}`,
			variant: "tertiary",
		};
	return hasResult
		? { label: "Captioned", variant: "subtle" }
		: { label: "Not captioned yet", variant: "muted" };
}

export function VoiceCaptionsStatus() {
	const { result } = useElementGeneration();
	const status: Status = result?.textTimestamps?.length
		? { label: "Captioned from the voice", variant: "subtle" }
		: { label: "Captions come with the voice", variant: "muted" };
	return <IconChip icon={Captions} {...status} />;
}

/** Says whether the clip's captions exist; making them is the Caption button's job. */
export function TranscribedCaptionsStatus({
	element,
}: {
	element: ContentElement;
}) {
	const captions = useGenerate(element, "captions");
	return <IconChip icon={Captions} {...transcriptStatus(captions)} />;
}
