import { useCallback } from "react";
import { useSlateStatic } from "slate-react";
import { captionsNode, captionsNodeId } from "@/lib/captions/captions-job";
import { removeCaptions, resetCaptions } from "@/lib/captions/revise-words";
import type { GeneratedElement } from "@/lib/canvas/types";
import { resolveModel } from "@/lib/connectors/models";
import type { AssetResult } from "@/lib/connectors/types";
import {
	useGenerationQueue,
	useQueueSelector,
} from "@/lib/generation/generation-queue-provider";

/** Queues a transcript of each clip's take, on the project's Speech to Text pick at the time. */
export function useCaptionClips() {
	const queue = useGenerationQueue();
	const editor = useSlateStatic();
	return useCallback(
		(clips: GeneratedElement[]) => {
			const model = resolveModel(
				"transcript",
				editor.defaultModels().transcript,
			);
			queue.enqueueGraph(
				clips.flatMap((clip) => {
					const take = queue.getElementSnapshot(clip.id).result;
					return take ? [captionsNode(clip, take, model)] : [];
				}),
			);
		},
		[queue, editor],
	);
}

export function useClipCaptions(
	element: GeneratedElement,
	clip: AssetResult | null,
) {
	const queue = useGenerationQueue();
	const caption = useCaptionClips();
	const { status, error } = useQueueSelector((q) =>
		q.getElementSnapshot(captionsNodeId(element.id)),
	);
	const revise = (change: (result: AssetResult) => AssetResult) => () =>
		queue.reviseResult(element.id, change);

	return {
		captioned: clip?.textTimestamps !== undefined,
		edited: Boolean(clip?.generatedTextTimestamps),
		status,
		error,
		generate: () => caption([element]),
		remove: revise(removeCaptions),
		reset: revise(resetCaptions),
	};
}
