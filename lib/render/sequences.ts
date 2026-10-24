import type { Sequence, SequenceMap } from "./types";

export const layoutSequences = <S>({
	series,
	sequences,
}: {
	series: S[];
	sequences: SequenceMap<S>;
}): S[] => [
	...series,
	...Object.values(sequences).flatMap((list) => list ?? []),
];

/** How long a sequence plays before the next scene begins over it. */
export const secUntilNextScene = (
	{ start, duration }: Pick<Sequence, "start" | "duration">,
	series: readonly Pick<Sequence, "start">[],
): number =>
	Math.min(
		duration,
		(series.find((scene) => scene.start > start)?.start ?? Infinity) - start,
	);
