"use client";

import { useMemo } from "react";
import { useSlateStatic } from "slate-react";
import { Button } from "@/components/ui/button";
import { MagicCaptions } from "@/components/ui/icon";
import { captionsNodeId } from "@/lib/captions/captions-job";
import { getCanvasElements } from "@/lib/canvas/assets";
import { hasCaptions } from "@/lib/canvas/types";
import { plural } from "@/lib/format";
import { generatedById } from "@/lib/generation/generation-graph";
import { useQueueSelector } from "@/lib/generation/generation-queue-provider";
import { isGenerationActive } from "@/lib/generation/snapshots";
import { layoutSequences } from "@/lib/render/scene-builder";
import { useLayout } from "../../player/render-layout-context";
import { useCaptionClips } from "../hooks/use-clip-captions";

function describe(active: boolean, pending: number, captionable: number) {
	if (captionable === 0) return "No clips to caption";
	if (active) return "Captioning…";
	if (pending === 0) return "Every clip is captioned";
	return `Caption ${pending} ${plural(pending, "clip")}`;
}

/** Transcribes every clip on the timeline that has no words yet. */
export function AutoCaptionsButton() {
	const editor = useSlateStatic();
	const { layout } = useLayout();
	const caption = useCaptionClips();

	const captionable = useMemo(
		() => [
			...new Set(
				layoutSequences(layout)
					.filter(({ element }) => hasCaptions(element.type))
					.map(({ element }) => element.id),
			),
		],
		[layout],
	);
	const uncaptioned = useQueueSelector((q) =>
		captionable
			.filter(
				(id) => q.getElementSnapshot(id).result?.textTimestamps === undefined,
			)
			.join(" "),
	);
	const clips = useMemo(() => {
		const canvas = getCanvasElements(editor.children);
		return uncaptioned
			.split(" ")
			.flatMap((id) => (id ? (generatedById(canvas, id) ?? []) : []));
	}, [editor, uncaptioned]);
	const active = useQueueSelector((q) =>
		clips.some(({ id }) =>
			isGenerationActive(q.getElementSnapshot(captionsNodeId(id)).status),
		),
	);

	return (
		<Button
			size="sm"
			variant="generate"
			className="w-full"
			tooltip={describe(active, clips.length, captionable.length)}
			unavailable={active || clips.length === 0}
			onClick={() => caption(clips)}
		>
			<MagicCaptions aria-hidden="true" />
			Auto captions
		</Button>
	);
}
