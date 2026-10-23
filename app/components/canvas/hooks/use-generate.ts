import { useCallback } from "react";
import {
	useGenerationQueue,
	useQueueSelector,
} from "@/lib/generation/generation-queue-provider";
import { hasPrompt, type GenerationNode } from "@/lib/generation/graph";
import { staleReason } from "@/lib/generation/stale-reason";
import { buildNode } from "@/lib/generation/generation-graph";
import { useBuildContext } from "@/lib/generation/use-build-context";
import { useLiveNode } from "@/lib/generation/use-live-nodes";
import type { GeneratedElement } from "@/lib/canvas/types";

/** Where `node` stands in the queue, with `generate` as the caller queues it. */
export function useNodeGeneration(node: GenerationNode, generate: () => void) {
	const queue = useGenerationQueue();
	const snapshot = useQueueSelector((q) => q.getElementSnapshot(node.id));
	const reason = useQueueSelector((q) => staleReason(node, q));

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
		hasResult: Boolean(snapshot.result),
		generate,
		discard,
	};
}

export function useGenerate(element: GeneratedElement) {
	const queue = useGenerationQueue();
	const buildContext = useBuildContext();
	const node = useLiveNode(element);

	// Built again at the click: a live node's job may lag, see useLiveNode.
	const generate = useCallback(() => {
		const current = buildNode(element, buildContext());
		if (!hasPrompt(current)) {
			queue.setError(current.id, "Enter a prompt first");
			return;
		}
		queue.enqueueGraph([current]);
	}, [queue, element, buildContext]);

	return { ...useNodeGeneration(node, generate), hasPrompt: hasPrompt(node) };
}
