"use client";

import { useSlateStatic } from "slate-react";
import { Captions } from "@/components/ui/icon";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { mergeAttrs } from "@/lib/canvas/editor-ops";
import { showsCaptions } from "@/lib/canvas/element-attributes";
import { TOGGLE_OFF, TOGGLE_ON, type ContentElement } from "@/lib/canvas/types";
import { HeaderIconButton } from "./header-icon-button";

/** Shows or hides this clip's captions in the video. It never generates anything. */
export function ElementCaptionsToggle({
	element,
}: {
	element: ContentElement;
}) {
	const editor = useSlateStatic();
	const on = showsCaptions(element);

	return (
		<SimpleTooltip
			label={on ? "Hide this clip's captions" : "Show this clip's captions"}
		>
			<HeaderIconButton
				ariaLabel="Captions"
				aria-pressed={on}
				variant={on ? "default" : "quiet"}
				chip={on}
				onClick={() =>
					mergeAttrs(editor, element.id, {
						captions: on ? TOGGLE_OFF : TOGGLE_ON,
					})
				}
			>
				<Captions size={14} />
			</HeaderIconButton>
		</SimpleTooltip>
	);
}
