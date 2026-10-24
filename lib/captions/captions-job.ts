import type { GeneratedElement } from "@/lib/canvas/types";
import type { AssetResult, ModelRef } from "@/lib/connectors/types";
import type { GenerationNode, NodeId } from "@/lib/generation/graph";
import type { GenerationQueue } from "@/lib/generation/queue";
import { isGenerationActive } from "@/lib/generation/snapshots";
import { withTranscript } from "./revise-words";

const SUFFIX = ":captions";

export const captionsNodeId = (clipId: string): NodeId => `${clipId}${SUFFIX}`;

const clipOf = (id: NodeId) =>
	id.endsWith(SUFFIX) ? id.slice(0, -SUFFIX.length) : null;

const soundOf = (take: AssetResult) => take.videoUrl ?? take.audioUrl;

/** Transcribes the take `clip` holds now, so captioning never remakes the clip. */
export function captionsNode(
	clip: Pick<GeneratedElement, "id" | "type">,
	take: AssetResult,
	model: ModelRef,
): GenerationNode {
	const mediaUrl = soundOf(take);
	if (!mediaUrl) throw new Error("This clip has no sound to caption");
	return {
		id: captionsNodeId(clip.id),
		inputs: { prompt: "", attributes: { mediaUrl }, reads: {} },
		dependsOn: {},
		job: {
			elementType: clip.type,
			connectorType: "transcript",
			model,
			config: {},
		},
	};
}

/** A transcript lands on the take it was made from and leaves no result of its own; a clip remade meanwhile fails it. */
export const landCaptions = (queue: GenerationQueue) =>
	queue.onCommitted(({ elementId, inputs, result }) => {
		const clipId = clipOf(elementId);
		if (!clipId) return;
		const clip = queue.getElementSnapshot(clipId);
		if (
			!clip.result ||
			isGenerationActive(clip.status) ||
			soundOf(clip.result) !== inputs.attributes.mediaUrl
		) {
			queue.setError(elementId, "The clip changed while it was captioned");
			return;
		}
		queue.reviseResult(clipId, (current) => withTranscript(current, result));
		queue.discard(elementId);
	});
