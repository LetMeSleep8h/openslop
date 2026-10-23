"use client";

import { useMemo, type ReactNode } from "react";
import { Captions } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { SimpleTooltip } from "@/components/ui/tooltip";
import {
	captionSource,
	isGenerated,
	type ContentElement,
	type GeneratedElement,
} from "@/lib/canvas/types";
import { isGenerationActive } from "@/lib/generation/snapshots";
import { toFrames } from "@/lib/render/frames";
import { layoutSequences } from "@/lib/render/scene-builder";
import { usePlayerControl } from "../../player/player-control-context";
import { usePlayerPlacement } from "../../player/player-placement-context";
import { useLayout } from "../../player/render-layout-context";
import { useClipCaptions } from "../hooks/use-clip-captions";
import { HeaderIconButton } from "./header-icon-button";

/** Pauses the player on the clip's first caption; null while the clip shows none. */
function useShowCaptions(elementId: string) {
	const { layout } = useLayout();
	const { player } = usePlayerControl();
	const { showPlayer } = usePlayerPlacement();
	const at = useMemo(() => {
		const clip = layoutSequences(layout).find(
			({ element }) => element.id === elementId,
		);
		const first = clip?.element.captions?.words[0];
		return clip && first ? clip.start + first.start : null;
	}, [layout, elementId]);

	if (at === null) return null;
	return () => {
		showPlayer();
		player?.pause();
		player?.seekTo(toFrames(at, layout.fps));
	};
}

function CaptionsButton({
	label,
	onClick,
	children = <Captions size={14} />,
}: {
	label: string;
	onClick: (() => void) | null;
	children?: ReactNode;
}) {
	return (
		<SimpleTooltip label={label}>
			<HeaderIconButton
				ariaLabel={label}
				unavailable={!onClick}
				onClick={onClick ?? undefined}
			>
				{children}
			</HeaderIconButton>
		</SimpleTooltip>
	);
}

function VoiceCaptionsButton({ element }: { element: GeneratedElement }) {
	const show = useShowCaptions(element.id);
	return (
		<CaptionsButton
			label={show ? "Show captions" : "Generate the voice to get captions"}
			onClick={show}
		/>
	);
}

function TranscribedCaptionsButton({ element }: { element: GeneratedElement }) {
	const show = useShowCaptions(element.id);
	const { status, error, staleReason, generate } = useClipCaptions(element);

	if (isGenerationActive(status))
		return (
			<CaptionsButton label="Captioning…" onClick={null}>
				<Spinner className="text-current" />
			</CaptionsButton>
		);
	if (show && !staleReason)
		return <CaptionsButton label="Show captions" onClick={show} />;
	if (error)
		return <CaptionsButton label={`${error}. Try again`} onClick={generate} />;
	return (
		<CaptionsButton
			label={
				staleReason ? `Caption again: ${staleReason}` : "Caption this clip"
			}
			onClick={generate}
		/>
	);
}

/** Any clip with sound has captions: speech brings its own, video and music are transcribed. */
export function ElementCaptionsButton({
	element,
}: {
	element: ContentElement;
}) {
	const source = captionSource(element.type);
	if (!source || !isGenerated(element)) return null;
	return source === "voice" ? (
		<VoiceCaptionsButton element={element} />
	) : (
		<TranscribedCaptionsButton element={element} />
	);
}
