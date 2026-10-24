import { captionsOf } from "@/lib/canvas/types";
import type { Sequence } from "./types";

const overlaps = (a: Sequence, b: Sequence) =>
	a.start < b.start + b.duration && b.start < a.start + a.duration;

/** A video with speech over it shows none of its own captions; every caption stops short of the tail the next scene's transition steals. */
export function applyCaptionRule(
	sequences: Sequence[],
	transitionSec: number,
): void {
	const captioned = sequences.filter((sequence) => sequence.element.captions);
	const speech = captioned.filter(
		({ element }) => captionsOf(element.type) === "speech",
	);
	for (const sequence of captioned) {
		const { captions, type } = sequence.element;
		const spokenOver =
			captionsOf(type) === "video" &&
			speech.some((other) => overlaps(sequence, other));
		sequence.element = {
			...sequence.element,
			captions:
				captions && !spokenOver
					? { ...captions, untilSec: sequence.duration - transitionSec }
					: undefined,
		};
	}
}
