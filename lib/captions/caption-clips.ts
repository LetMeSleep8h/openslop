import sortBy from "lodash/sortBy";
import uniqBy from "lodash/uniqBy";
import {
	CONTENT_TYPES,
	type CaptionSource,
	type ContentSpec,
} from "@/lib/canvas/types";
import { layoutSequences } from "@/lib/render/scene-builder";
import type { RenderLayout, Sequence } from "@/lib/render/types";

export type CaptionClip = Sequence & { source: CaptionSource };

export function captionClips(layout: RenderLayout): CaptionClip[] {
	const placed = sortBy(layoutSequences(layout), "start");
	return uniqBy(placed, (sequence) => sequence.element.id).flatMap(
		(sequence) => {
			const { captions }: ContentSpec = CONTENT_TYPES[sequence.element.type];
			return captions ? [{ ...sequence, source: captions }] : [];
		},
	);
}
