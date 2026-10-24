"use client";

import { useMemo } from "react";
import { useSlateStatic } from "slate-react";
import { Button } from "@/components/ui/button";
import { MagicCaptions } from "@/components/ui/icon";
import { captionsNodeId } from "@/lib/captions/captions-job";
import { getCanvasElements } from "@/lib/canvas/assets";
import { isCaptionable } from "@/lib/canvas/types";
import { plural } from "@/lib/format";
import { generatedById } from "@/lib/generation/generation-graph";
import {
	useGenerationQueue,
	useQueueSelector,
} from "@/lib/generation/generation-queue-provider";
import type { GenerationQueue } from "@/lib/generation/queue";
import { isGenerationActive } from "@/lib/generation/snapshots";
import { layoutSequences } from "@/lib/render/sequences";
import { useLayout } from "@/app/components/player/render-layout-context";
import { useTranscribeClips } from "../hooks/use-clip-captions";

const uncaptioned = (queue: GenerationQueue, ids: string[]) =>
	ids.filter(
		(id) => queue.getElementSnapshot(id).result?.textTimestamps === undefined,
	);

function describe(active: boolean, pending: number, captionable: number) {
	if (captionable === 0) return "No clips to caption";
	if (active) return "Captioning…";
	if (pending === 0) return "Every clip is captioned";
	return `Caption ${pending} ${plural(pending, "clip")}`;
}

/** Transcribes every clip on the timeline that has no words yet. */
export function AutoCaptionsButton() {
	const editor = useSlateStatic();
	const queue = useGenerationQueue();
	const { layout } = useLayout();
	const transcribe = useTranscribeClips();

	const captionable = useMemo(
		() => [
			...new Set(
				layoutSequences(layout)
					.filter(({ element }) => isCaptionable(element.type))
					.map(({ element }) => element.id),
			),
		],
		[layout],
	);
	const pending = useQueueSelector((q) => uncaptioned(q, captionable).length);
	const active = useQueueSelector((q) =>
		captionable.some((id) =>
			isGenerationActive(q.getElementSnapshot(captionsNodeId(id)).status),
		),
	);

	const captionAll = () => {
		const canvas = getCanvasElements(editor.children);
		transcribe(
			uncaptioned(queue, captionable).flatMap(
				(id) => generatedById(canvas, id) ?? [],
			),
		);
	};

	return (
		<Button
			size="sm"
			variant="generate"
			className="w-full"
			tooltip={describe(active, pending, captionable.length)}
			unavailable={active || pending === 0}
			onClick={captionAll}
		>
			<MagicCaptions aria-hidden="true" />
			Auto captions
		</Button>
	);
}
