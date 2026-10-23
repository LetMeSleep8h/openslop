import { createContext, type ReactNode } from "react";
import type { CaptionWord } from "@/lib/captions/caption-layout";
import type { CaptionStyle } from "@/lib/captions/caption-style";
import { CaptionOverlay } from "./caption-overlay";

export type CaptionLineProps = {
	style: CaptionStyle;
	words: CaptionWord[];
	fontSizePx: number;
	ownerId: string;
	/** The span of the owner's words the line shows, which an edit replaces. */
	from: number;
	to: number;
};

// The editor swaps in a line that edits; an export keeps the static one.
export const CaptionLineContext = createContext<
	(props: CaptionLineProps) => ReactNode
>(({ style, words, fontSizePx }) => (
	<CaptionOverlay style={style} words={words} fontSizePx={fontSizePx} />
));
