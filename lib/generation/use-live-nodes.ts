"use client";

import { useCallback } from "react";
import { useSlateSelector } from "slate-react";
import { shallow } from "zustand/shallow";
import type { GeneratedElement } from "@/lib/canvas/types";
import type { DerivedKind } from "@/lib/connectors/registry";
import type { GenerationNode } from "./graph";
import { useLiveGraph } from "./live-graph-provider";

/** The element's own node, or with `kind` the job derived from it. */
export function useLiveNode(
	element: GeneratedElement,
	kind?: DerivedKind,
): GenerationNode {
	const graph = useLiveGraph();
	const read = useCallback(
		() => graph().resolve(element, kind),
		[graph, element, kind],
	);
	return useSlateSelector(read);
}

/** Memoize `elements`. */
export function useLiveNodes(
	elements: () => GeneratedElement[],
	kind?: DerivedKind,
): GenerationNode[] {
	const graph = useLiveGraph();
	const read = useCallback(() => {
		const live = graph();
		return elements().map((element) => live.resolve(element, kind));
	}, [graph, elements, kind]);
	return useSlateSelector(read, shallow);
}
