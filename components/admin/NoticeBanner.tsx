import { cn } from "@/lib/utils";

type NoticeBannerProps = {
	type: "success" | "error" | "info";
	message: string;
	className?: string;
};

const styles: Record<NoticeBannerProps["type"], string> = {
	success:
		"border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300",
	error:
		"border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300",
	info:
		"border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300",
};

export default function NoticeBanner({ type, message, className }: NoticeBannerProps) {
	return (
		<div className={cn("mb-4 rounded-lg border px-4 py-3 text-sm", styles[type], className)}>
			{message}
		</div>
	);
}
