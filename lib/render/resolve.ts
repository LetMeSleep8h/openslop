import {
	CONTENT_TYPES,
	captionSource,
	type CanvasBlock,
	type ContentElement,
} from "@/lib/canvas/types";
import { isScene } from "@/lib/canvas/scenes";
import { getPromptText } from "@/lib/generation/inputs";
import { getPrimaryUrl } from "@/lib/connectors/asset-url";
import { derivedNodeId } from "@/lib/generation/graph";
import type { ElementSnapshot } from "@/lib/generation/snapshots";
import type { ResolvedCaptions, ResolvedElement } from "./types";
import {
	getLoop,
	getLoops,
	getMotion,
	getVolume,
} from "../canvas/element-attributes";
import { elementTrim, trimTimestamps } from "./clip-trim";

type GetSnapshot = (id: string) => ElementSnapshot;

/** The node whose result holds a clip's words: the clip's own for speech, its derived captions for anything transcribed. */
function captionsOwnerId({
	id,
	type,
}: Pick<ContentElement, "id" | "type">): string | undefined {
	const source = captionSource(type);
	if (source === "voice") return id;
	if (source === "transcript") return derivedNodeId(id, "captions");
	return undefined;
}

function resolveCaptions(
	element: ContentElement,
	getSnapshot: GetSnapshot,
	trimStartSec: number,
): ResolvedCaptions | undefined {
	const ownerId = captionsOwnerId(element);
	if (!ownerId) return undefined;
	const timestamps = getSnapshot(ownerId).result?.textTimestamps;
	if (!timestamps?.length) return undefined;
	const words = trimTimestamps(timestamps, trimStartSec);
	return { ownerId, firstWord: timestamps.length - words.length, words };
}

export function resolveElements(
	blocks: CanvasBlock[],
	getSnapshot: GetSnapshot,
	{ captionsEnabled }: { captionsEnabled: boolean },
): ResolvedElement[] {
	const resolved: ResolvedElement[] = [];
	let sceneNumber = 0;

	for (const scene of blocks) {
		if (!isScene(scene)) continue;
		sceneNumber += 1;

		for (const element of scene.children) {
			const snapshot = getSnapshot(element.id);
			if (!snapshot.result) continue;

			const spec = CONTENT_TYPES[element.type];
			const url = getPrimaryUrl(snapshot.result, spec.outputKind);
			if (!url) continue;

			const mediaDurationSec = snapshot.result.durationSec;
			const trim = elementTrim(element, mediaDurationSec);

			resolved.push({
				id: element.id,
				type: element.type,
				role: spec.role,
				layer: spec.layer,
				sceneId: scene.id,
				sceneNumber,
				prompt: getPromptText(element),
				url,
				...trim,
				mediaDurationSec,
				loops: getLoops(element),
				loop: getLoop(element),
				volume: getVolume(element),
				motion: getMotion(element),
				captions: captionsEnabled
					? resolveCaptions(element, getSnapshot, trim.trimStartSec)
					: undefined,
			});
		}
	}

	return resolved;
}
