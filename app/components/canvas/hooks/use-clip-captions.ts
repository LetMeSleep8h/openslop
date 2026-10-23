import { useCallback } from "react";
import type { GeneratedElement } from "@/lib/canvas/types";
import { buildNodes } from "@/lib/generation/generation-graph";
import { useGenerationQueue } from "@/lib/generation/generation-queue-provider";
import { useBuildContext } from "@/lib/generation/use-build-context";
import { useLiveNode, useLiveNodes } from "@/lib/generation/use-live-nodes";
import { useNodeGeneration } from "./use-generate";
import { useNodeScope } from "./use-generate-scope";

export function useClipCaptions(element: GeneratedElement) {
	const queue = useGenerationQueue();
	const buildContext = useBuildContext();
	const node = useLiveNode(element, "captions");

	const generate = useCallback(() => {
		queue.enqueueGraph(buildNodes([element], buildContext(), "captions"));
	}, [queue, element, buildContext]);

	return useNodeGeneration(node, generate);
}

/** Memoize `elements`. */
export function useCaptionsScope(elements: () => GeneratedElement[]) {
	const buildContext = useBuildContext();
	const nodes = useLiveNodes(elements, "captions");
	const build = useCallback(
		() => buildNodes(elements(), buildContext(), "captions"),
		[elements, buildContext],
	);
	return useNodeScope(nodes, build);
}
