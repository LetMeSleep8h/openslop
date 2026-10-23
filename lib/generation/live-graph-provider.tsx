"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useSlateStatic } from "slate-react";
import { useShallow } from "zustand/react/shallow";
import { createRequiredContext } from "@/lib/components/create-required-context";
import { useModelChain } from "@/lib/connectors/use-default-models";
import { useProject } from "@/lib/project/use-project";
import { buildSettings } from "./graph";
import { createGraphFor, type GenerationGraph } from "./generation-graph";
import { useBuildContext } from "./use-build-context";

const [LiveGraphContext, useLiveGraph] =
	createRequiredContext<() => GenerationGraph>("LiveGraphContext");
export { useLiveGraph };

export function LiveGraphProvider({ children }: { children: ReactNode }) {
	const editor = useSlateStatic();
	const buildContext = useBuildContext();
	const settings = useProject(useShallow(buildSettings));
	const models = useModelChain();
	const [graphFor] = useState(createGraphFor);

	const graph = useCallback(
		() => graphFor(buildContext, editor.children, settings, models),
		[editor, graphFor, buildContext, settings, models],
	);

	return <LiveGraphContext value={graph}>{children}</LiveGraphContext>;
}
