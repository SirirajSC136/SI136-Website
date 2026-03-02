import { ReactNode } from "react";

type AdminPageHeaderProps = {
	title: string;
	subtitle?: string;
	actions?: ReactNode;
};

export default function AdminPageHeader({
	title,
	subtitle,
	actions,
}: AdminPageHeaderProps) {
	return (
		<header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
					{title}
				</h1>
				{subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
			</div>
			{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
		</header>
	);
}
