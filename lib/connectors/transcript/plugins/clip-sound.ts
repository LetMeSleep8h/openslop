import { isGenerated } from "@/lib/canvas/types";
import type {
	ConnectorPlugin,
	TranscriptGenerateParams,
} from "@/lib/connectors/types";
import type { Dependency } from "@/lib/generation/declare";

const CLIP_LABEL = "the clip";

const clip: Dependency = (element) => ({
	[CLIP_LABEL]: isGenerated(element) ? element : undefined,
});

/** Transcribes the clip's own sound. */
export function createClipSoundPlugin(): ConnectorPlugin<TranscriptGenerateParams> {
	return {
		name: "clip-sound",
		dependencies: [clip],
		beforeGenerate(params, ctx) {
			const source = ctx.dependencies?.[CLIP_LABEL];
			const mediaUrl = source?.videoUrl ?? source?.audioUrl;
			if (!mediaUrl) throw new Error("This clip has no sound to caption");
			return { ...params, mediaUrl };
		},
	};
}
