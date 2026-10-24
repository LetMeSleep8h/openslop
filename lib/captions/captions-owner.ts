import type { AssetResult } from "@/lib/connectors/types";
import { derivedNodeId, type NodeId } from "@/lib/generation/graph";

/** A clip's transcript captions it once made; until then, the words its own model returned, if any. */
export function captionsOwnerId(
	clipId: string,
	resultOf: (id: NodeId) => AssetResult | null | undefined,
): NodeId {
	const transcriptId = derivedNodeId(clipId, "captions");
	const hasWords = (id: NodeId) =>
		Boolean(resultOf(id)?.textTimestamps?.length);
	return hasWords(transcriptId) || !hasWords(clipId) ? transcriptId : clipId;
}
