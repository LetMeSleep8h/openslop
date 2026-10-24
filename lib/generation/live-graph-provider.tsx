"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useSlateStatic } from "slate-react";
import { useShallow } from "zustand/react/shallow";
import { createRequiredContext } from "@/lib/components/create-required-context";
import type { GeneratedElement } from "@/lib/canvas/types";
import type { DerivedKind } from "@/lib/connectors/registry";
import { useProject } from "@/lib/project/use-project";
import { buildSettings, type GenerationNode } from "./graph";
import { createGraphFor } from "./generation-graph";
import { useBuildContext } from "./use-build-context";

const [LiveGraphContext, useResolveNode] =
	createRequiredContext<
		(element: GeneratedElement, kind?: DerivedKind) => GenerationNode
	>("LiveGraphContext");
export { useResolveNode };

export function LiveGraphProvider({ children }: { children: ReactNode }) {
	const editor = useSlateStatic();
	const buildContext = useBuildContext();
	const settings = useProject(useShallow(buildSettings));
	const [graphFor] = useState(createGraphFor);

	const resolve = useCallback(
		(element: GeneratedElement, kind?: DerivedKind) =>
			graphFor(buildContext, editor.children, settings).resolve(element, kind),
		[editor, graphFor, buildContext, settings],
	);

	return <LiveGraphContext value={resolve}>{children}</LiveGraphContext>;
}
