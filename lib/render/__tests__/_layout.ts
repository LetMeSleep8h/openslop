import { CONTENT_TYPES, type ContentType } from "@/lib/canvas/types";
import { VideoSettingsSchema } from "@/lib/project/video-settings";
import { buildRenderLayout, type BuildLayoutOptions } from "../scene-builder";
import type { RenderLayout, ResolvedElement } from "../types";

export const layoutOf = (
	elements: ResolvedElement[],
	options?: Partial<BuildLayoutOptions>,
): RenderLayout =>
	buildRenderLayout(elements, { ...VideoSettingsSchema.parse({}), ...options });

export const resolvedElement = (
	id: string,
	type: ContentType,
	overrides: Partial<ResolvedElement> = {},
): ResolvedElement => ({
	id,
	type,
	role: CONTENT_TYPES[type].role,
	layer: CONTENT_TYPES[type].layer,
	sceneId: "s1",
	sceneNumber: 1,
	prompt: "",
	url: `https://example.com/${id}`,
	durationSec: 4,
	mediaDurationSec: 4,
	trimStartSec: 0,
	loops: 1,
	loop: false,
	volume: 10,
	motion: "none",
	...overrides,
});
