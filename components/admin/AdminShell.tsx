import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import AdminSectionNav from "@/components/admin/AdminSectionNav";

type AdminShellProps = {
	children: ReactNode;
	className?: string;
	showNav?: boolean;
};

export default function AdminShell({
	children,
	className,
	showNav = true,
}: AdminShellProps) {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<main className={cn("container mx-auto px-4 py-6 md:px-8 md:py-8", className)}>
				{showNav && <AdminSectionNav />}
				{children}
			</main>
		</div>
	);
}
