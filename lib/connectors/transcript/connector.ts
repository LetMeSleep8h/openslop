import type { AssetBundle } from "@/lib/api/asset-bundle";
import { HttpAssetGateway } from "@/lib/gateway/http";
import { readTimestamps } from "@/lib/providers/timestamps-file";
import { BaseJobConnector } from "../asset-base";
import type {
	ResolvedConnectorConfig,
	TranscriptGenerateParams,
	TranscriptResult,
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
			textTimestamps: await readTimestamps(bundle),
		};
	}
}
