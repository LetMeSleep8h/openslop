import { Fragment, use, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CaptionLineContext } from "@/components/captions/caption-line";
import { createRequiredContext } from "@/lib/components/create-required-context";
import {
	activeWordIndex,
	captionLineAt,
	wordsOnLine,
} from "@/lib/captions/caption-layout";
import {
	captionFontSizePx,
	type CaptionStyle,
} from "@/lib/captions/caption-style";
import { yieldsAt } from "@/lib/render/caption-yields";
import { toSeconds } from "@/lib/render/frames";
import type { ResolvedCaptions, ResolvedElement } from "@/lib/render/types";

// Caption styling applies to every caption in the composition, so it rides a
// provider rather than threading through the sequence layers that never read it.
const [CaptionStyleContext, useCaptionStyle] =
	createRequiredContext<CaptionStyle>("CaptionStyleContext");

export const CaptionStyleProvider = CaptionStyleContext.Provider;

export function Captions({
	captions: { firstWord, words: timestamps, yieldSec = [] },
	clip,
}: {
	captions: ResolvedCaptions;
	clip: Pick<ResolvedElement, "id" | "sceneId">;
}) {
	const style = useCaptionStyle();
	const renderLine = use(CaptionLineContext);
	const frame = useCurrentFrame();
	const { fps, height } = useVideoConfig();

	const { words, startTimes, lineIds } = useMemo(
		() => ({
			words: timestamps.map(({ text }) => text),
			startTimes: timestamps.map(({ start }) => start),
			lineIds: timestamps.map(({ line }) => line),
		}),
		[timestamps],
	);

	const seconds = toSeconds(frame, fps);
	if (yieldsAt(yieldSec, seconds)) return null;

	const index = activeWordIndex(startTimes, seconds);
	const line = captionLineAt(
		words.length,
		index,
		style.maxWordsPerLine,
		lineIds,
	);

	return (
		<AbsoluteFill>
			{/* A new line starts a fresh edit. */}
			<Fragment key={line.start}>
				{renderLine({
					style,
					words: wordsOnLine(words, index, line, style.reveal),
					fontSizePx: captionFontSizePx(style.fontSize, height),
					clipId: clip.id,
					sceneId: clip.sceneId,
					from: firstWord + line.start,
					to: firstWord + line.end,
				})}
			</Fragment>
		</AbsoluteFill>
	);
}
