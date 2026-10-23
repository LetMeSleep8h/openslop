import type { ElementRole } from "@/lib/canvas/types";
import type { Sequence } from "./types";

const CAPTION_RANK: Record<ElementRole, number> = {
	overlay: 0,
	foreground: 1,
	background: 2,
	effect: 3,
};

/** Speech outranks a video's sound, which outranks the music under it: where two clips would caption at once, only the higher shows. */
export function captionYields(
	sequence: Sequence,
	captioned: Sequence[],
): [number, number][] {
	const rank = CAPTION_RANK[sequence.element.role];
	const end = sequence.start + sequence.duration;
	return captioned.flatMap(({ element, start, duration }) => {
		if (CAPTION_RANK[element.role] >= rank) return [];
		const from = Math.max(start, sequence.start);
		const to = Math.min(start + duration, end);
		return to > from
			? [[from - sequence.start, to - sequence.start] as [number, number]]
			: [];
	});
}
