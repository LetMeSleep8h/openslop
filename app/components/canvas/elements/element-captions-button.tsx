"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Captions, Eye } from "@/components/ui/icon";
import {
	Popover,
	PopoverContent,
	PopoverHeader,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { SimpleTooltip } from "@/components/ui/tooltip";
import {
	CONTENT_TYPES,
	isGenerated,
	type ContentElement,
	type ContentSpec,
	type GeneratedElement,
} from "@/lib/canvas/types";
import { captionClips } from "@/lib/captions/caption-clips";
import { captionLines } from "@/lib/captions/caption-layout";
import { useCaptionStyle } from "@/lib/captions/use-caption-style";
import { isGenerationActive } from "@/lib/generation/snapshots";
import { useProject } from "@/lib/project/use-project";
import { useVideoSetting } from "@/lib/project/use-video-setting";
import { toFrames } from "@/lib/render/frames";
import { formatTime } from "@/lib/render/timestamps";
import { usePlayerControl } from "../../player/player-control-context";
import { usePlayerPlacement } from "../../player/player-placement-context";
import { useLayout } from "../../player/render-layout-context";
import { useClipCaptions } from "../hooks/use-clip-captions";
import { useElementGeneration } from "./element-generation-context";
import { GENERATE_ICON, StaleIndicator } from "./generate-button";
import { HeaderIconButton } from "./header-icon-button";

function useSeekPaused() {
	const { player } = usePlayerControl();
	const { showPlayer } = usePlayerPlacement();
	const { layout } = useLayout();
	return useCallback(
		(seconds: number) => {
			showPlayer();
			player?.pause();
			player?.seekTo(toFrames(seconds, layout.fps));
		},
		[player, showPlayer, layout.fps],
	);
}

function Note({ children }: { children: ReactNode }) {
	return (
		<p className="px-2 py-1.5 text-label-xs text-muted-foreground">
			{children}
		</p>
	);
}

/** Mounts only while the popover is open, so a closed card never watches the layout. */
function CaptionLines({
	elementId,
	empty,
}: {
	elementId: string;
	empty: string;
}) {
	const { layout } = useLayout();
	const [{ maxWordsPerLine }] = useCaptionStyle();
	const seek = useSeekPaused();
	const clip = useMemo(
		() => captionClips(layout).find(({ element }) => element.id === elementId),
		[layout, elementId],
	);
	const words = useMemo(() => clip?.element.captions?.words ?? [], [clip]);
	const lines = useMemo(
		() =>
			captionLines(
				words.length,
				maxWordsPerLine,
				words.map(({ line }) => line),
			),
		[words, maxWordsPerLine],
	);

	if (!clip || lines.length === 0) return <Note>{empty}</Note>;

	return (
		<>
			<ul className="-mx-1 flex max-h-72 flex-col overflow-y-auto overscroll-contain">
				{lines.map(({ start, end }) => {
					const at = clip.start + (words[start]?.start ?? 0);
					return (
						<li key={start}>
							<button
								type="button"
								className="flex w-full items-baseline gap-2.5 rounded-md px-2 py-1.5 text-start text-label-xs transition-colors hover:bg-button-hover focus-ring"
								onClick={() => seek(at)}
							>
								<span className="shrink-0 font-numeric text-muted-foreground">
									{formatTime(at)}
								</span>
								<span className="min-w-0 text-foreground">
									{words
										.slice(start, end)
										.map(({ text }) => text)
										.join(" ")}
								</span>
							</button>
						</li>
					);
				})}
			</ul>
			<Note>
				Pick a line to find it in the player, then click it there to edit.
			</Note>
		</>
	);
}

function HiddenNotice() {
	const shown = useVideoSetting("captions");
	const updateVideoSettings = useProject((state) => state.updateVideoSettings);
	if (shown) return null;
	return (
		<div className="flex items-center justify-between gap-2 px-2 py-1.5">
			<span className="text-label-xs text-muted-foreground">
				Captions are hidden in the video
			</span>
			<Button
				type="button"
				variant="secondary"
				size="sm"
				onClick={() => updateVideoSettings({ captions: true })}
			>
				<Eye aria-hidden="true" />
				Show
			</Button>
		</div>
	);
}

function CaptionsPopover({
	elementId,
	icon,
	empty,
	children,
}: {
	elementId: string;
	icon: ReactNode;
	empty: string;
	children: ReactNode;
}) {
	return (
		<Popover>
			<SimpleTooltip label="Captions">
				<PopoverTrigger asChild>
					<HeaderIconButton ariaLabel="Captions">{icon}</HeaderIconButton>
				</PopoverTrigger>
			</SimpleTooltip>
			<PopoverContent
				align="start"
				aria-label="Captions"
				className="w-80 font-medium"
			>
				<PopoverHeader title="Captions" />
				<div aria-live="polite" className="flex flex-col">
					<CaptionLines elementId={elementId} empty={empty} />
					<HiddenNotice />
					{children}
				</div>
			</PopoverContent>
		</Popover>
	);
}

function VoiceCaptions({ element }: { element: GeneratedElement }) {
	return (
		<CaptionsPopover
			elementId={element.id}
			icon={<Captions size={14} />}
			empty="Generate the voice and its captions come with it."
		>
			<Note>Timed from the voice, so they follow it when it changes.</Note>
		</CaptionsPopover>
	);
}

function captionLabel(active: boolean, hasResult: boolean) {
	if (active) return "Captioning…";
	return hasResult ? "Caption again" : "Caption";
}

function TranscribedCaptions({ element }: { element: GeneratedElement }) {
	const { hasResult: clipReady } = useElementGeneration();
	const { status, error, hasResult, staleReason, generate } =
		useClipCaptions(element);
	const active = isGenerationActive(status);

	return (
		<CaptionsPopover
			elementId={element.id}
			icon={
				active ? <Spinner className="text-current" /> : <Captions size={14} />
			}
			empty={
				clipReady
					? "Not captioned yet. Caption it to transcribe what it says or sings."
					: "Generate this clip, then caption it."
			}
		>
			{error && (
				<p
					role="alert"
					className="flex items-center gap-1.5 px-2 py-1.5 text-label-xs text-destructive"
				>
					<AlertCircle className="h-3.5 w-3.5 shrink-0" />
					{error}
				</p>
			)}
			<div className="flex items-center justify-end gap-2 px-2 pt-1.5">
				{staleReason && <StaleIndicator reason={staleReason} />}
				<Button
					type="button"
					variant="generate"
					size="sm"
					unavailable={!clipReady || active}
					tooltip={
						clipReady
							? "Transcribe this clip into timed captions"
							: "Generate this clip first"
					}
					onClick={generate}
				>
					{GENERATE_ICON[status]}
					{captionLabel(active, hasResult)}
				</Button>
			</div>
		</CaptionsPopover>
	);
}

/** Any clip with sound has captions: speech brings its own, video and music are transcribed. */
export function ElementCaptionsButton({
	element,
}: {
	element: ContentElement;
}) {
	const { captions }: ContentSpec = CONTENT_TYPES[element.type];
	if (!captions || !isGenerated(element)) return null;
	return captions === "voice" ? (
		<VoiceCaptions element={element} />
	) : (
		<TranscribedCaptions element={element} />
	);
}
