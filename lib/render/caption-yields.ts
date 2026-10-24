import { captionRank } from "@/lib/canvas/types";
import type { Sequence } from "./types";

const rankOf = ({ element }: Sequence) => captionRank(element.type) ?? Infinity;

/** Speech outranks a video's sound, which outranks the music under it: where two clips would caption at once, only the higher shows. */
function captionYields(
	sequence: Sequence,
	captioned: Sequence[],
): [number, number][] {
	const rank = rankOf(sequence);
	const end = sequence.start + sequence.duration;
	return captioned.flatMap((other) => {
		const { start, duration } = other;
		if (rankOf(other) >= rank) return [];
		const from = Math.max(start, sequence.start);
		const to = Math.min(start + duration, end);
		return to > from
			? [[from - sequence.start, to - sequence.start] as [number, number]]
			: [];
	});
}

/** Each clip's captions also give up the tail the next scene's transition steals. */
export function applyCaptionYields(
	sequences: Sequence[],
	transitionSec: number,
): void {
	const captioned = sequences.filter((sequence) => sequence.element.captions);
	for (const sequence of captioned) {
		const { captions } = sequence.element;
		const { duration } = sequence;
		const yieldSec = captionYields(sequence, captioned);
		if (transitionSec > 0)
			yieldSec.push([Math.max(0, duration - transitionSec), duration]);
		if (captions && yieldSec.length > 0)
			sequence.element = {
				...sequence.element,
				captions: { ...captions, yieldSec },
			};
	}
}

/** The parts of `[from, to)` a clip's captions show, around the spans they yield. */
export function shownSpans(
	from: number,
	to: number,
	yieldSec: [number, number][],
): [number, number][] {
	const spans: [number, number][] = [];
	let at = from;
	for (const [start, end] of yieldSec.toSorted(([a], [b]) => a - b)) {
		if (start > at) spans.push([at, Math.min(start, to)]);
		at = Math.max(at, end);
	}
	if (to > at) spans.push([at, to]);
	return spans.filter(([start, end]) => end > start);
}
