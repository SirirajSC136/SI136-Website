import { cn } from "@/lib/utils";

type AdminStatusBadgeProps = {
	variant: "success" | "error" | "active" | "inactive" | "info";
	label: string;
};

const styles: Record<AdminStatusBadgeProps["variant"], string> = {
	success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
	error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
	active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
	inactive: "bg-muted text-muted-foreground",
	info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

export default function AdminStatusBadge({ variant, label }: AdminStatusBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
				styles[variant]
			)}
		>
			{label}
		</span>
	);
}
