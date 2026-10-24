import type { ContentType, ElementRole, LayerType } from "@/lib/canvas/types";
import type { TextTimestamp } from "@/lib/connectors/types";
import type { CaptionStyle } from "../captions/caption-style";
import type { MotionEffect } from "./motion-effect-names";
import type { TransitionType } from "./transitions";

/** The words a clip shows, from its trim start. */
export type ResolvedCaptions = {
	/** Where `words` start in the clip's own word list, past those the trim cut. */
	firstWord: number;
	words: TextTimestamp[];
};

/** Captions on the timeline stop `untilSec` after their clip starts. */
export type LaidOutCaptions = ResolvedCaptions & { untilSec: number };

export type ResolvedElement = {
	id: string;
	type: ContentType;
	role: ElementRole;
	layer: LayerType;
	/** The scene that holds it, and its place in the document. */
	sceneId: string;
	sceneNumber: number;
	prompt: string;
	url: string;
	/** How long it holds the timeline once trimmed; a visual can outlast its media. */
	durationSec: number;
	mediaDurationSec: number;
	trimStartSec: number;
	loops: number;
	/** Whether a video restarts when it ends, instead of holding its last frame. */
	loop: boolean;
	volume: number;
	motion: MotionEffect;
	captions?: ResolvedCaptions;
};

export type LaidOutElement = Omit<ResolvedElement, "captions"> & {
	captions?: LaidOutCaptions;
};

export type Sequence<E = LaidOutElement> = {
	element: E;
	start: number;
	duration: number;
	/** A scene says how long the overlays under it run; it holds at least that long. */
	overlaySec?: number;
};

/** A sequence before the caption rule lays out its captions. */
export type DraftSequence = Sequence<ResolvedElement>;

export type SequenceMap<S = Sequence> = Partial<Record<ContentType, S[]>>;

export type RenderLayout = {
	series: Sequence[];
	sequences: SequenceMap;
	fps: number;
	width: number;
	height: number;
	totalDurationSec: number;
	totalFrames: number;
	transitionType: TransitionType;
	transitionDurationSec: number;
	captionStyle: CaptionStyle;
	filmGrain: boolean;
	rgbSplit: boolean;
};

export const COMPOSITION_ID = "VideoComposition";

export type VideoConfig = {
	fps: number;
	width: number;
	height: number;
};

export const BASE_WIDTH = 1920;
export const BASE_HEIGHT = 1080;

export const DEFAULT_CONFIG: VideoConfig = {
	fps: 24,
	width: BASE_WIDTH,
	height: BASE_HEIGHT,
};
