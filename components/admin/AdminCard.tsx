import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminCardProps = {
	children: ReactNode;
	className?: string;
};

export default function AdminCard({ children, className }: AdminCardProps) {
	return (
		<div
			className={cn(
				"rounded-xl border border-border bg-card p-4 shadow-sm md:p-6",
				className
			)}
		>
			{children}
		</div>
	);
}
