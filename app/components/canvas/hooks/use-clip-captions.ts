import { removeCaptions, resetCaptions } from "@/lib/captions/revise-words";
import type { GeneratedElement } from "@/lib/canvas/types";
import type { AssetResult } from "@/lib/connectors/types";
import { useGenerationQueue } from "@/lib/generation/generation-queue-provider";
import { useGenerate } from "./use-generate";

export function useClipCaptions(
	element: GeneratedElement,
	clip: AssetResult | null,
) {
	const queue = useGenerationQueue();
	const { status, error, generate } = useGenerate(element, "captions");
	const revise = (change: (result: AssetResult) => AssetResult) => () =>
		queue.reviseResult(element.id, change);

	return {
		captioned: clip?.textTimestamps !== undefined,
		edited: Boolean(clip?.generatedTextTimestamps),
		status,
		error,
		generate,
		remove: revise(removeCaptions),
		reset: revise(resetCaptions),
	};
}
