"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
	{ href: "/admin", label: "Console" },
	{ href: "/admin/customize", label: "Customize" },
	{ href: "/admin/admins", label: "Admins" },
	{ href: "/admin/logs", label: "Logs" },
];

export default function AdminSectionNav() {
	const pathname = usePathname();

	return (
		<nav className="mb-6 overflow-x-auto">
			<div className="inline-flex min-w-full gap-2 rounded-xl border border-border bg-card p-1">
				{items.map((item) => {
					const isActive =
						pathname === item.href ||
						(item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"rounded-lg px-3 py-2 text-sm font-medium transition",
								isActive
									? "bg-emerald-600 text-white shadow-sm"
									: "text-muted-foreground hover:bg-accent hover:text-foreground"
							)}
						>
							{item.label}
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
