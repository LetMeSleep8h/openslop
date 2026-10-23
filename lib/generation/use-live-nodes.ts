"use client";

import { useCallback } from "react";
import { useSlateSelector } from "slate-react";
import { shallow } from "zustand/shallow";
import type { GeneratedElement } from "@/lib/canvas/types";
import type { DerivedKind } from "@/lib/connectors/registry";
import type { GenerationNode } from "./graph";
import { useResolveNode } from "./live-graph-provider";

/** The element's own node, or with `kind` the job derived from it. */
export function useLiveNode(
	element: GeneratedElement,
	kind?: DerivedKind,
): GenerationNode {
	const resolve = useResolveNode();
	const read = useCallback(
		() => resolve(element, kind),
		[resolve, element, kind],
	);
	return useSlateSelector(read);
}

/** Memoize `elements`. */
export function useLiveNodes(
	elements: () => GeneratedElement[],
	kind?: DerivedKind,
): GenerationNode[] {
	const resolve = useResolveNode();
	const read = useCallback(
		() => elements().map((element) => resolve(element, kind)),
		[resolve, elements, kind],
	);
	return useSlateSelector(read, shallow);
}
