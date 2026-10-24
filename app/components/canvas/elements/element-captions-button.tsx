"use client";

import { useState, type ReactNode } from "react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
	CaptionsReady,
	CaptionsStale,
	Hourglass,
	MagicCaptions,
	RotateCcw,
	Trash2,
} from "@/components/ui/icon";
import { ICON_SIZES } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/spinner";
import {
	SimpleTooltip,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ContentElement } from "@/lib/canvas/types";
import { useClipCaptions } from "../hooks/use-clip-captions";
import { ELEMENT_CONFIGS } from "./element-configs";
import { useElementGeneration } from "./element-generation-context";
import { HeaderIconButton } from "./header-icon-button";

const SIZE = ICON_SIZES.header;

type Captions = ReturnType<typeof useClipCaptions>;

interface Face {
	label: string;
	icon: ReactNode;
	variant?: "destructive";
	onClick?: () => void;
}

/** How the button looks before there are captions to act on; null once there are. */
function faceOf(hasClip: boolean, captions: Captions): Face | null {
	if (!hasClip)
		return {
			label: "Generate the clip first to caption it",
			icon: <MagicCaptions size={SIZE} />,
		};
	if (captions.status === "queued")
		return { label: "Captions queued", icon: <Hourglass size={SIZE} /> };
	if (captions.status !== "idle")
		return {
			label: "Generating captions…",
			icon: <Spinner className="text-current" />,
		};
	if (captions.captions) return null;
	if (captions.error)
		return {
			label: `Captions failed: ${captions.error}. Try again`,
			icon: <CaptionsStale size={SIZE} />,
			variant: "destructive",
			onClick: captions.generate,
		};
	return {
		label: "Generate captions",
		icon: <MagicCaptions size={SIZE} />,
		onClick: captions.generate,
	};
}

function menuOf(captions: Captions, onRemove: () => void): ActionMenuItem[] {
	const items: (ActionMenuItem | false)[] = [
		{
			key: "regenerate",
			label: "Regenerate captions",
			icon: <MagicCaptions />,
			onSelect: captions.generate,
		},
		captions.edited && {
			key: "reset",
			label: "Reset edits",
			icon: <RotateCcw />,
			onSelect: captions.reset,
		},
		{
			key: "remove",
			label: "Remove captions",
			icon: <Trash2 />,
			variant: "destructive",
			onSelect: onRemove,
		},
	];
	return items.filter((item) => item !== false);
}

/** A sparkle makes captions, a check has them, an alert means out of date. */
export function ElementCaptionsButton({
	element,
}: {
	element: ContentElement;
}) {
	const { result: clip } = useElementGeneration();
	const captions = useClipCaptions(element, clip);
	const face = faceOf(Boolean(clip), captions);
	const [removing, setRemoving] = useState(false);

	if (face)
		return (
			<SimpleTooltip label={face.label}>
				<HeaderIconButton
					ariaLabel={face.label}
					variant={face.variant ?? "quiet"}
					unavailable={!face.onClick}
					onClick={face.onClick}
				>
					{face.icon}
				</HeaderIconButton>
			</SimpleTooltip>
		);

	const state = captions.staleReason
		? `Captions out of date: ${captions.staleReason}`
		: "Captions ready";
	const label = captions.edited ? `${state}, edited in the player` : state;
	const Icon = captions.staleReason ? CaptionsStale : CaptionsReady;
	return (
		<>
			<Tooltip>
				<ActionMenu
					items={menuOf(captions, () => setRemoving(true))}
					align="end"
				>
					<TooltipTrigger asChild>
						<HeaderIconButton
							ariaLabel={label}
							variant={captions.staleReason ? "stale" : "quiet"}
						>
							<Icon size={SIZE} />
						</HeaderIconButton>
					</TooltipTrigger>
				</ActionMenu>
				<TooltipContent>{label}</TooltipContent>
			</Tooltip>
			<ConfirmDeleteDialog
				target={removing ? captions : undefined}
				onClose={() => setRemoving(false)}
				title={() =>
					`Remove this ${ELEMENT_CONFIGS[element.type].label.toLowerCase()}'s captions?`
				}
				description="Only this clip loses its captions and any edits to them. Getting them back means generating them again."
				actionLabel="Remove captions"
				onConfirm={({ remove }) => remove()}
			/>
		</>
	);
}
