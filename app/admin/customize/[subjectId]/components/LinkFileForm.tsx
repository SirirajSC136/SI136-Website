"use client";

export default function LinkFileForm({
	data,
	setData,
}: {
	data: any;
	setData: (next: any) => void;
}) {
	return (
		<div>
			<label className="mb-1 block text-sm font-medium text-muted-foreground">URL</label>
			<input
				value={data.url || ""}
				onChange={(event) => setData({ ...data, url: event.target.value })}
				placeholder="https://..."
				required
				className="block w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
			/>
		</div>
	);
}
