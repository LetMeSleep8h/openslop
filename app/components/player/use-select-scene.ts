"use client";

import { useCallback } from "react";
import {
	scrollToElement,
	scrollToScene,
} from "@/app/components/canvas/utils/scroll-to-scene";
import { useSetActiveSceneId } from "@/app/components/scene-selection/active-scene-context";
import { clamp } from "@/lib/utils";
import { toFrames } from "@/lib/render/frames";
import { usePlayerScrub } from "./use-player-scrub";
import { useLayout } from "./render-layout-context";

/**
 * Picking a scene: mark it active, bring it into view on the canvas, and move
 * the playhead to where it starts. A scene with nothing on the timeline yet has
 * no start, and is selected without seeking. With `elementId`, that element's
 * card is brought into view instead of the scene.
 */
export function useSelectScene() {
	const { layout } = useLayout();
	const setActiveSceneId = useSetActiveSceneId();
	const scrub = usePlayerScrub();

	return useCallback(
		(sceneId: string, startSec: number | null, elementId?: string) => {
			setActiveSceneId(sceneId);
			if (elementId) scrollToElement(elementId);
			else scrollToScene(sceneId);
			if (startSec === null) return;
			scrub.seekTo(
				toFrames(clamp(startSec, 0, layout.totalDurationSec), layout.fps),
			);
		},
		[layout.fps, layout.totalDurationSec, scrub, setActiveSceneId],
	);
}
