import Cartesia from "@cartesia/cartesia-js";
import type { BundleFile } from "@/lib/api/asset-bundle";
import { AssetBundle } from "@/lib/api/asset-bundle";
import { BaseProvider } from "../base";
import { timestampsFile } from "../timestamps-file";
import type { RawTranscript, TranscriptRequest } from "./base";
import { validateCartesiaKey } from "../cartesia";
import type { TranscriptProvider } from "../types";

/** Cartesia reports no per-request cost: a credit buys 2 seconds, at the Scale plan's $299 for 8M credits. */
const USD_PER_SECOND = 299 / 8_000_000 / 2;

/** Ink reads an upload, not a URL; the media comes from the request, so only our own store is fetched. */
async function fetchOwnMedia(url: string): Promise<Response> {
	if (!AssetBundle.holds(url))
		throw new Error(`Media to transcribe is not in our store: ${url}`);
	const res = await fetch(url);
	if (!res.ok)
		throw new Error(`Media to transcribe failed to load (${res.status})`);
	return res;
}

export class CartesiaTranscript
	extends BaseProvider<TranscriptRequest, RawTranscript>
	implements TranscriptProvider
{
	protected readonly blobConfig = { type: "transcript", provider: "cartesia" };
	private readonly client: Cartesia;

	constructor(private readonly apiKey: string) {
		super();
		this.client = new Cartesia({ apiKey });
	}

	async validate() {
		return validateCartesiaKey(this.apiKey);
	}

	protected toFiles(result: RawTranscript): BundleFile[] {
		return [timestampsFile(result.textTimestamps)];
	}

	protected async _generate({ mediaUrl, model }: TranscriptRequest) {
		const { words, duration } = await this.client.stt.transcribe({
			file: await fetchOwnMedia(mediaUrl),
			model,
			timestamp_granularities: ["word"],
		});
		const textTimestamps = (words ?? []).map(({ word, start, end }) => ({
			text: word,
			start,
			end,
		}));
		const durationSec = duration ?? textTimestamps.at(-1)?.end ?? 0;
		return {
			textTimestamps,
			costUsd: durationSec * USD_PER_SECOND,
			metadata: { durationSec },
		};
	}
}
