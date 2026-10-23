import type { VendorParams } from "@/lib/connectors/models";
import type {
	SourcedTranscriptParams,
	TextTimestamp,
} from "@/lib/connectors/types";
import type { RawResult } from "../base";

export type TranscriptRequest = VendorParams<SourcedTranscriptParams>;

export type RawTranscript = { textTimestamps: TextTimestamp[] } & RawResult;
