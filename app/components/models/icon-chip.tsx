import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import type { IconComponent } from "@/components/ui/icon";
import { SimpleTooltip } from "@/components/ui/tooltip";

export function IconChip({
	icon: Icon,
	label,
	iconClassName,
	variant,
}: {
	icon: IconComponent;
	label: string;
	iconClassName?: string;
	variant?: ComponentProps<typeof Badge>["variant"];
}) {
	return (
		<SimpleTooltip label={label}>
			<Badge
				size="icon"
				variant={variant}
				className={variant ? undefined : "text-foreground"}
			>
				<Icon aria-hidden="true" className={iconClassName} />
				<span className="sr-only">{label}</span>
			</Badge>
		</SimpleTooltip>
	);
}
