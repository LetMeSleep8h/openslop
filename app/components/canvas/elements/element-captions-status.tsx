"use client";

import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { Captions } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { SimpleTooltip } from "@/components/ui/tooltip";
import type { ContentElement } from "@/lib/canvas/types";
import { isGenerationActive } from "@/lib/generation/snapshots";
import { useClipCaptions } from "../hooks/use-clip-captions";
import { useElementGeneration } from "./element-generation-context";

type Tone = NonNullable<ComponentProps<typeof Badge>["variant"]>;

/** Says whether a clip's captions exist; making them is the Caption button's job. */
function CaptionsStatus({
	label,
	tone,
	busy = false,
}: {
	label: string;
	tone: Tone;
	busy?: boolean;
}) {
	return (
		<SimpleTooltip label={label}>
			<Badge size="icon" variant={tone}>
				{busy ? (
					<Spinner className="text-current" />
				) : (
					<Captions aria-hidden="true" size={14} />
				)}
				<span className="sr-only">{label}</span>
			</Badge>
		</SimpleTooltip>
	);
}

export function VoiceCaptionsStatus() {
	const { result } = useElementGeneration();
	return result?.textTimestamps?.length ? (
		<CaptionsStatus label="Captioned from the voice" tone="subtle" />
	) : (
		<CaptionsStatus label="Captions come with the voice" tone="muted" />
	);
}

export function TranscribedCaptionsStatus({
	element,
}: {
	element: ContentElement;
}) {
	const { status, error, hasResult, staleReason } = useClipCaptions(element);
	if (isGenerationActive(status))
		return <CaptionsStatus label="Captioning…" tone="subtle" busy />;
	if (error)
		return (
			<CaptionsStatus label={`Captions failed: ${error}`} tone="destructive" />
		);
	if (staleReason)
		return (
			<CaptionsStatus
				label={`Captions out of date: ${staleReason}`}
				tone="tertiary"
			/>
		);
	return hasResult ? (
		<CaptionsStatus label="Captioned" tone="subtle" />
	) : (
		<CaptionsStatus label="Not captioned yet" tone="muted" />
	);
}
