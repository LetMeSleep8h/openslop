import type { BundleFile } from "@/lib/api/asset-bundle";
import type { TextTimestamp } from "@/lib/connectors/types";

/** Word timings ride in a bundle as this file, which connectors read back by its key. */
export const timestampsFile = (words: TextTimestamp[]): BundleFile => ({
	key: "timestamps",
	filename: "timestamps.json",
	data: JSON.stringify(words),
	contentType: "application/json",
});
