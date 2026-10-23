"use client";

import { useCallback, useMemo } from "react";
import { useSlateStatic } from "slate-react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "@/components/ui/icon";
import { getCanvasElements } from "@/lib/canvas/assets";
import { captionSource } from "@/lib/canvas/types";
import { plural } from "@/lib/format";
import { generatedById } from "@/lib/generation/generation-graph";
import { layoutSequences } from "@/lib/render/scene-builder";
import { useLayout } from "../../player/render-layout-context";
import { useCaptionsScope } from "../hooks/use-clip-captions";
import type { GenerateCounts } from "../hooks/use-generate-scope";

function describe({ empty, active, pending }: GenerateCounts) {
	if (empty) return "No video or music to caption";
	if (active) return "Captioning…";
	if (pending === 0) return "Every clip is captioned";
	return `Caption ${pending} ${plural(pending, "clip")}`;
}

/** Transcribes every video and music clip on the timeline that is missing captions or out of date. */
export function CaptionAllButton() {
	const editor = useSlateStatic();
	const { layout } = useLayout();

	const transcribed = useMemo(() => {
		const canvas = getCanvasElements(editor.children);
		const ids = layoutSequences(layout)
			.map(({ element }) => element)
			.filter(({ type }) => captionSource(type) === "transcript")
			.map(({ id }) => id);
		return [...new Set(ids)].flatMap((id) => generatedById(canvas, id) ?? []);
	}, [editor, layout]);
	const scope = useCaptionsScope(useCallback(() => transcribed, [transcribed]));

	return (
		<Button
			size="xs"
			variant="generate"
			tooltip={describe(scope)}
			unavailable={scope.active || scope.pending === 0}
			onClick={scope.run}
		>
			<Sparkles aria-hidden="true" />
			Caption all
		</Button>
	);
}
