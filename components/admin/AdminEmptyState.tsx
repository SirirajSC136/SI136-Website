type AdminEmptyStateProps = {
	title: string;
	description?: string;
};

export default function AdminEmptyState({
	title,
	description,
}: AdminEmptyStateProps) {
	return (
		<div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
			<p className="text-base font-semibold text-foreground">{title}</p>
			{description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
		</div>
	);
}
