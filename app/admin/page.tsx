import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import AdminCard from "@/components/admin/AdminCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const adminOptions = [
	{
		title: "Customize Content",
		description:
			"Manage courses, topics, materials, and interactive content shown in academics pages.",
		href: "/admin/customize",
		cta: "Open Customize",
	},
	{
		title: "Manage Admins",
		description:
			"Grant or revoke admin access using Firestore-backed admin records.",
		href: "/admin/admins",
		cta: "Open Admin Manager",
	},
	{
		title: "Audit Logs",
		description:
			"Inspect all admin write attempts across admin APIs, including success and failure events.",
		href: "/admin/logs",
		cta: "Open Logs",
	},
];

export default function AdminHomePage() {
	return (
		<AdminShell>
			<AdminPageHeader
				title="Admin Console"
				subtitle="Choose a management area for this project."
			/>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{adminOptions.map((option) => (
					<AdminCard key={option.href} className="flex flex-col">
						<h2 className="text-xl font-semibold text-foreground">{option.title}</h2>
						<p className="mt-2 flex-1 text-sm text-muted-foreground">{option.description}</p>
						<Link
							href={option.href}
							className="mt-4 inline-flex w-fit rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
						>
							{option.cta}
						</Link>
					</AdminCard>
				))}
			</div>
		</AdminShell>
	);
}
