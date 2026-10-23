import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import {
	SpeechToTextConvertRequestModelId,
	type SpeechToTextWordResponseModel,
} from "@elevenlabs/elevenlabs-js/api";
import type { TextTimestamp } from "@/lib/connectors/types";
import type { BundleFile } from "@/lib/api/asset-bundle";
import { BaseProvider } from "../base";
import { timestampsFile } from "../timestamps-file";
import type { RawTranscript, TranscriptRequest } from "./base";
import { validateElevenLabsKey } from "../elevenlabs";
import type { TranscriptProvider } from "../types";

/** ElevenLabs reports no per-request cost; batch Scribe is $0.22 an hour. */
const USD_PER_HOUR = 0.22;

const SCRIBE_MODELS: readonly string[] = Object.values(
	SpeechToTextConvertRequestModelId,
);

const isScribeModel = (id: string): id is SpeechToTextConvertRequestModelId =>
	SCRIBE_MODELS.includes(id);

/** Spoken words only: the gaps between them and sounds like laughter are not captions. */
const toTimestamps = (
	words: SpeechToTextWordResponseModel[],
): TextTimestamp[] =>
	words.flatMap(({ text, type, start, end }) =>
		type === "word" && start !== undefined && end !== undefined
			? [{ text, start, end }]
			: [],
	);

export class ElevenLabsTranscript
	extends BaseProvider<TranscriptRequest, RawTranscript>
	implements TranscriptProvider
{
	protected readonly blobConfig = {
		type: "transcript",
		provider: "elevenlabs",
	};
	private readonly client: ElevenLabsClient;

	constructor(private readonly apiKey: string) {
		super();
		this.client = new ElevenLabsClient({ apiKey });
	}

	async validate() {
		return validateElevenLabsKey(this.apiKey);
	}

	protected toFiles(result: RawTranscript): BundleFile[] {
		return [timestampsFile(result.textTimestamps)];
	}

	protected async _generate({ mediaUrl, model }: TranscriptRequest) {
		if (!isScribeModel(model))
			throw new Error(`ElevenLabs has no speech-to-text model "${model}"`);
		const { words, audioDurationSecs } = await this.client.speechToText.convert(
			{
				modelId: model,
				cloudStorageUrl: mediaUrl,
				timestampsGranularity: "word",
				tagAudioEvents: false,
			},
		);
		const textTimestamps = toTimestamps(words);
		const durationSec = audioDurationSecs ?? textTimestamps.at(-1)?.end ?? 0;
		return {
			textTimestamps,
			costUsd: (durationSec / 3600) * USD_PER_HOUR,
			metadata: { durationSec },
		};
	}
}
