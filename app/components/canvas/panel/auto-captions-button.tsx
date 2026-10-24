"use client";

import { useCallback } from "react";
import { useSlateStatic } from "slate-react";
import { Button } from "@/components/ui/button";
import { MagicCaptions } from "@/components/ui/icon";
import { getCanvasElements } from "@/lib/canvas/assets";
import { hasCaptions } from "@/lib/canvas/types";
import { plural } from "@/lib/format";
import { buildNodes, generatedById } from "@/lib/generation/generation-graph";
import { useBuildContext } from "@/lib/generation/use-build-context";
import { useGenerationQueue } from "@/lib/generation/generation-queue-provider";
import { useLiveNodes } from "@/lib/generation/use-live-nodes";
import { layoutSequences } from "@/lib/render/scene-builder";
import { useLayout } from "../../player/render-layout-context";
import { useNodeScope, type GenerateCounts } from "../hooks/use-generate-scope";

function describe({ empty, active, pending }: GenerateCounts) {
	if (empty) return "No clips to caption";
	if (active) return "Captioning…";
	if (pending === 0) return "Every clip is captioned";
	return `Caption ${pending} ${plural(pending, "clip")}`;
}

/** Transcribes every clip on the timeline that has no words yet. */
export function AutoCaptionsButton() {
	const editor = useSlateStatic();
	const queue = useGenerationQueue();
	const { layout } = useLayout();
	const buildContext = useBuildContext();

	const transcribed = useCallback(() => {
		const canvas = getCanvasElements(editor.children);
		const ids = layoutSequences(layout)
			.map(({ element }) => element)
			.filter(
				({ id, type }) =>
					hasCaptions(type) &&
					queue.getElementSnapshot(id).result?.textTimestamps === undefined,
			)
			.map(({ id }) => id);
		return [...new Set(ids)].flatMap((id) => generatedById(canvas, id) ?? []);
	}, [editor, layout, queue]);
	const build = useCallback(
		() => buildNodes(transcribed(), buildContext(), "captions"),
		[transcribed, buildContext],
	);
	const scope = useNodeScope(useLiveNodes(transcribed, "captions"), build);

	return (
		<Button
			size="sm"
			variant="generate"
			className="w-full"
			tooltip={describe(scope)}
			unavailable={scope.active || scope.pending === 0}
			onClick={scope.run}
		>
			<MagicCaptions aria-hidden="true" />
			Auto captions
		</Button>
	);
}
