import isEqual from "lodash/isEqual";
import mapValues from "lodash/mapValues";
import pickBy from "lodash/pickBy";
import memoizeOne from "memoize-one";
import { shallow } from "zustand/shallow";
import { resolveElementConnector } from "@/lib/canvas/element-connector";
import {
	isGenerated,
	type GeneratedElement,
	type CanvasElement,
} from "@/lib/canvas/types";
import { providerModel, resolveModel } from "@/lib/connectors/models";
import { DERIVED_JOBS, type DerivedKind } from "@/lib/connectors/registry";
import type { ConnectorPlugin } from "@/lib/connectors/types";
import { getPromptText } from "./inputs";
import {
	derivedNodeId,
	type BuildContext,
	type GenerationNode,
	type NodeId,
} from "./graph";

export const generatedById = (canvas: CanvasElement[], id: string) =>
	canvas.find(
		(element): element is GeneratedElement =>
			isGenerated(element) && element.id === id,
	);

type Declared = { reads: string; dependencies: GeneratedElement };

/** What the plugins declare of one kind, by label; a label two plugins share is refused, an empty value left out. */
export const pluginRecords = <K extends keyof Declared>(
	plugins: ConnectorPlugin[],
	kind: K,
	element: GeneratedElement,
	ctx: BuildContext,
): Record<string, Declared[K]> => {
	const records = plugins.flatMap((plugin) =>
		(plugin[kind] ?? []).map((declare) => declare(element, ctx)),
	);
	const labels = records.flatMap(Object.keys);
	const repeated = labels.find((label, i) => labels.indexOf(label) !== i);
	if (repeated) throw new Error(`Two plugins declare "${repeated}"`);
	return pickBy(Object.assign({}, ...records));
};

const nodeId = (element: GeneratedElement, kind?: DerivedKind): NodeId =>
	kind ? derivedNodeId(element.id, kind) : element.id;

/** An element's node runs on its own prompt and connector; a derived one reads the element and takes no prompt. */
function nodeSource(
	element: GeneratedElement,
	ctx: BuildContext,
	kind?: DerivedKind,
) {
	if (!kind)
		return {
			prompt: getPromptText(element),
			attributes: element.generationAttributes ?? {},
			connector: resolveElementConnector(element, ctx.registry, ctx.canvas),
		};
	const { connector: type, providerOf, ...config } = DERIVED_JOBS[kind];
	const { provider } = resolveModel(providerOf, ctx.models[providerOf]);
	return {
		prompt: "",
		attributes: {},
		connector: { type, model: providerModel(type, provider), config },
	};
}

/** `job` is not compared: it is how a node runs, not what it reads. */
const isUnchanged = (before: GenerationNode, after: GenerationNode) =>
	shallow(before.dependsOn, after.dependsOn) &&
	isEqual(before.inputs, after.inputs);

export class GenerationGraph {
	private readonly nodes = new Map<NodeId, GenerationNode>();
	private readonly previousNodes: Map<NodeId, GenerationNode>;
	private readonly visiting = new Set<NodeId>();

	constructor(
		private readonly ctx: BuildContext,
		previous?: GenerationGraph,
	) {
		this.previousNodes = previous?.nodes ?? new Map();
	}

	/** The element's own node, or with `kind` the job derived from it. */
	resolve = (element: GeneratedElement, kind?: DerivedKind): GenerationNode =>
		this.nodes.get(nodeId(element, kind)) ??
		this.build(generatedById(this.ctx.canvas, element.id) ?? element, kind);

	private build(element: GeneratedElement, kind?: DerivedKind): GenerationNode {
		const id = nodeId(element, kind);
		const cached = this.nodes.get(id);
		if (cached) return cached;
		if (this.visiting.has(id))
			throw new Error(`Cyclic generation dependency at "${id}"`);
		this.visiting.add(id);

		try {
			const { prompt, attributes, connector } = nodeSource(
				element,
				this.ctx,
				kind,
			);
			const plugins = connector.config.plugins ?? [];
			return this.intern({
				id,
				inputs: {
					prompt,
					attributes,
					reads: pluginRecords(plugins, "reads", element, this.ctx),
				},
				dependsOn: this.dependenciesOf(element, plugins),
				job: {
					elementType: element.type,
					connectorType: connector.type,
					model: connector.model,
					config: connector.config,
				},
			});
		} finally {
			this.visiting.delete(id);
		}
	}

	private dependenciesOf(
		element: GeneratedElement,
		plugins: ConnectorPlugin[],
	) {
		return mapValues(
			pluginRecords(plugins, "dependencies", element, this.ctx),
			(target) => this.build(target),
		);
	}

	private intern(node: GenerationNode) {
		const previous = this.previousNodes.get(node.id);
		const kept = previous && isUnchanged(previous, node) ? previous : node;
		this.nodes.set(node.id, kept);
		return kept;
	}
}

export const createGraphFor = () => {
	let graph: GenerationGraph | undefined;
	return memoizeOne(
		(buildContext: () => BuildContext, ..._revision: unknown[]) => {
			graph = new GenerationGraph(buildContext(), graph);
			return graph;
		},
	);
};

export const buildNode = (
	element: GeneratedElement,
	ctx: BuildContext,
): GenerationNode => new GenerationGraph(ctx).resolve(element);

export const buildNodes = (
	elements: GeneratedElement[],
	ctx: BuildContext,
	kind?: DerivedKind,
): GenerationNode[] => {
	const graph = new GenerationGraph(ctx);
	return elements.map((element) => graph.resolve(element, kind));
};
