import { ReactNode } from "react";

type AdminTableProps = {
	headers: string[];
	children: ReactNode;
};

export default function AdminTable({ headers, children }: AdminTableProps) {
	return (
		<div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
			<table className="w-full min-w-[760px] text-left text-sm">
				<thead className="border-b border-border bg-secondary-background text-muted-foreground">
					<tr>
						{headers.map((header) => (
							<th key={header} className="px-4 py-3 font-semibold">
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-border">{children}</tbody>
			</table>
		</div>
	);
}
