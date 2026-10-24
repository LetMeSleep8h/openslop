"use client";

import { useEffect } from "react";
import { landCaptions } from "@/lib/captions/captions-job";
import { useGenerationQueue } from "@/lib/generation/generation-queue-provider";

export function CaptionsLander() {
	const queue = useGenerationQueue();
	useEffect(() => landCaptions(queue), [queue]);
	return null;
}
