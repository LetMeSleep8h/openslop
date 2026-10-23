import type { AssetBundle } from "@/lib/api/asset-bundle";
import { HttpAssetGateway } from "@/lib/gateway/http";
import { BaseJobConnector } from "../asset-base";
import { z } from "zod";
import {
	TextTimestampSchema,
	type ResolvedConnectorConfig,
	type TranscriptGenerateParams,
	type TranscriptResult,
} from "../types";

export class HttpTranscriptConnector extends BaseJobConnector<
	TranscriptGenerateParams,
	TranscriptResult
> {
	readonly type = "transcript" as const;

	constructor(config: ResolvedConnectorConfig) {
		super(new HttpAssetGateway(config.model, "transcript"), config);
	}

	async resolveBundle(bundle: AssetBundle): Promise<TranscriptResult> {
		return {
			durationSec: bundle.durationSec,
			textTimestamps: await bundle.fetchJson(
				"timestamps",
				z.array(TextTimestampSchema),
			),
		};
	}
}
