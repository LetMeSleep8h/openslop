"use client";

import { useRef, useState } from "react";
import type { CaptionLineProps } from "@/components/captions/caption-line";
import {
	CaptionOverlay,
	captionWordStyle,
} from "@/components/captions/caption-overlay";
import { editCaptions } from "@/lib/captions/revise-words";
import { isGenerationActive } from "@/lib/generation/snapshots";
import {
	useGenerationQueue,
	useQueueSelector,
} from "@/lib/generation/generation-queue-provider";
import { usePlayerPlaying } from "./use-player-state";
import { useSelectScene } from "./use-select-scene";

const LINE_CLASS =
	"pointer-events-auto rounded-[0.12em] outline-solid outline-0 outline-offset-[0.1em] outline-ring";

/** A paused line opens for editing on a click, bringing its clip's card into view, and saves to that clip. It stays shut while the clip regenerates. */
function EditableCaptionLine({
	style,
	words,
	fontSizePx,
	clipId,
	sceneId,
	from,
	to,
}: CaptionLineProps) {
	const playing = usePlayerPlaying();
	const selectScene = useSelectScene();
	const queue = useGenerationQueue();
	const regenerating = useQueueSelector((q) =>
		isGenerationActive(q.getElementSnapshot(clipId).status),
	);
	const [draft, setDraft] = useState<string | null>(null);
	const cancelled = useRef(false);
	const overlay = { style, words, fontSizePx };

	if (playing || regenerating) return <CaptionOverlay {...overlay} />;

	const text = words.map((word) => word.text).join(" ");

	const open = () => {
		selectScene(sceneId, null, clipId);
		cancelled.current = false;
		setDraft(text);
	};

	const save = (value: string) => {
		setDraft(null);
		if (cancelled.current || value.trim() === text) return;
		queue.reviseResult(clipId, (result) =>
			editCaptions(result, from, to, value),
		);
	};

	if (draft === null)
		return (
			<CaptionOverlay
				{...overlay}
				lineProps={{
					role: "button",
					tabIndex: 0,
					"aria-label": `Edit caption: ${text}`,
					className: `${LINE_CLASS} cursor-text hover:outline-[0.06em] focus-visible:outline-[0.06em]`,
					onClick: open,
					onKeyDown: (event) => {
						if (event.key !== "Enter" && event.key !== " ") return;
						event.preventDefault();
						open();
					},
				}}
			/>
		);

	return (
		<CaptionOverlay
			{...overlay}
			lineProps={{ className: `${LINE_CLASS} outline-[0.06em]` }}
		>
			<input
				autoFocus
				aria-label="Caption"
				name="caption"
				autoComplete="off"
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				onBlur={() => save(draft)}
				onKeyDown={(event) => {
					if (event.key === "Escape") cancelled.current = true;
					if (event.key === "Enter" || event.key === "Escape")
						event.currentTarget.blur();
				}}
				style={{
					font: "inherit",
					...captionWordStyle(style.base),
					fieldSizing: "content",
					border: "none",
					outline: "none",
					textAlign: "inherit",
					textTransform: "inherit",
				}}
			/>
		</CaptionOverlay>
	);
}

export const renderEditableCaptionLine = (props: CaptionLineProps) => (
	<EditableCaptionLine {...props} />
);
