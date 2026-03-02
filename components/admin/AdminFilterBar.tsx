import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminFilterBarProps = {
	children: ReactNode;
	className?: string;
};

export default function AdminFilterBar({ children, className }: AdminFilterBarProps) {
	return (
		<div
			className={cn(
				"mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4",
				className
			)}
		>
			{children}
		</div>
	);
}
