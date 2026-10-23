import { useCallback } from "react";
import {
	useGenerationQueue,
	useQueueSelector,
} from "@/lib/generation/generation-queue-provider";
import { hasPrompt } from "@/lib/generation/graph";
import { staleReason } from "@/lib/generation/stale-reason";
import { buildNode } from "@/lib/generation/generation-graph";
import { useBuildContext } from "@/lib/generation/use-build-context";
import { useLiveNode } from "@/lib/generation/use-live-nodes";
import type { GeneratedElement } from "@/lib/canvas/types";
import type { DerivedKind } from "@/lib/connectors/registry";

/** The element's own generation, or with `kind` the job derived from it, which takes no prompt. */
export function useGenerate(element: GeneratedElement, kind?: DerivedKind) {
	const queue = useGenerationQueue();
	const buildContext = useBuildContext();
	const node = useLiveNode(element, kind);
	const snapshot = useQueueSelector((q) => q.getElementSnapshot(node.id));
	const reason = useQueueSelector((q) => staleReason(node, q));

	// Built again at the click: a live node's job may lag, see useLiveNode.
	const generate = useCallback(() => {
		const current = buildNode(element, buildContext(), kind);
		if (!kind && !hasPrompt(current)) {
			queue.setError(current.id, "Enter a prompt first");
			return;
		}
		queue.enqueueGraph([current]);
	}, [queue, element, buildContext, kind]);

	const discard = useCallback(() => {
		queue.discard(node.id);
	}, [queue, node.id]);

	return {
		node,
		status: snapshot.status,
		startedAt: snapshot.startedAt,
		result: snapshot.result,
		error: snapshot.error,
		pinned: snapshot.pinned,
		staleReason: reason,
		hasPrompt: hasPrompt(node),
		hasResult: Boolean(snapshot.result),
		generate,
		discard,
	};
}
