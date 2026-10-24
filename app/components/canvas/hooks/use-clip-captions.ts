import { captionsOwnerId } from "@/lib/captions/captions-owner";
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
	const transcript = useGenerate(element, "captions");
	const ownWords =
		captionsOwnerId(element.id, (id) =>
			id === element.id ? clip : transcript.result,
		) === element.id;
	const captions = ownWords ? clip : transcript.result;
	const ownerId = ownWords ? element.id : transcript.node.id;

	return {
		captions,
		status: transcript.status,
		error: transcript.error,
		staleReason: transcript.staleReason,
		edited: Boolean(captions?.generatedTextTimestamps),
		generate: transcript.generate,
		remove: ownWords
			? () => queue.reviseResult(element.id, removeCaptions)
			: transcript.discard,
		reset: () => queue.reviseResult(ownerId, resetCaptions),
	};
}
