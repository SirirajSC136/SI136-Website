"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminCard from "@/components/admin/AdminCard";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminShell from "@/components/admin/AdminShell";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import NoticeBanner from "@/components/admin/NoticeBanner";

type AuditStatus = "success" | "error";

type AdminAuditEntry = {
	id: string;
	createdAt?: string;
	actorEmail?: string;
	actorName?: string;
	action: string;
	resourceType: string;
	resourceId?: string;
	status: AuditStatus;
	httpStatus: number;
	errorCode?: string;
	errorMessage?: string;
	requestPayload?: Record<string, unknown>;
	query?: Record<string, string>;
	durationMs: number;
	method: "POST" | "PUT" | "DELETE";
	path: string;
};

type LogsResponse = {
	entries: AdminAuditEntry[];
	nextCursor?: string;
};

export default function AdminLogsPage() {
	const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
	const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [notice, setNotice] = useState<
		{ type: "success" | "error" | "info"; message: string } | null
	>(null);

	const [actionFilter, setActionFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState<"" | AuditStatus>("");
	const [actorEmailFilter, setActorEmailFilter] = useState("");
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");

	const actionOptions = useMemo(
		() => [
			"admin.add",
			"admin.remove",
			"course.create",
			"course.delete",
			"topic.create",
			"topic.delete",
			"material.create",
			"material.update",
			"material.delete",
			"interactive.create",
		],
		[]
	);

	const buildParams = useCallback(
		(cursor?: string) => {
			const params = new URLSearchParams();
			params.set("limit", "25");
			if (cursor) params.set("cursor", cursor);
			if (actionFilter) params.set("action", actionFilter);
			if (statusFilter) params.set("status", statusFilter);
			if (actorEmailFilter) params.set("actorEmail", actorEmailFilter);
			if (fromDate) params.set("from", new Date(fromDate).toISOString());
			if (toDate) params.set("to", new Date(toDate).toISOString());
			return params;
		},
		[actionFilter, statusFilter, actorEmailFilter, fromDate, toDate]
	);

	const fetchLogs = useCallback(async () => {
		setLoading(true);
		setNotice(null);
		try {
			const response = await fetch(`/api/admin/logs?${buildParams().toString()}`, {
				cache: "no-store",
			});
			const payload = await response.json();
			if (!response.ok || !payload?.data) {
				throw new Error(payload?.error || "Failed to load logs");
			}
			const data = payload.data as LogsResponse;
			setEntries(data.entries);
			setNextCursor(data.nextCursor);
		} catch (error) {
			setNotice({ type: "error", message: `Could not load logs: ${error}` });
		} finally {
			setLoading(false);
		}
	}, [buildParams]);

	useEffect(() => {
		void fetchLogs();
	}, [fetchLogs]);

	const loadMore = async () => {
		if (!nextCursor) return;
		setLoadingMore(true);
		try {
			const response = await fetch(
				`/api/admin/logs?${buildParams(nextCursor).toString()}`,
				{ cache: "no-store" }
			);
			const payload = await response.json();
			if (!response.ok || !payload?.data) {
				throw new Error(payload?.error || "Failed to load more logs");
			}
			const data = payload.data as LogsResponse;
			setEntries((previous) => [...previous, ...data.entries]);
			setNextCursor(data.nextCursor);
		} catch (error) {
			setNotice({ type: "error", message: `Could not load more logs: ${error}` });
		} finally {
			setLoadingMore(false);
		}
	};

	return (
		<AdminShell>
			<AdminPageHeader
				title="Audit Logs"
				subtitle="All admin write attempts across admin mutation APIs."
			/>

			{notice ? <NoticeBanner type={notice.type} message={notice.message} /> : null}

			<AdminFilterBar>
				<div>
					<label className="mb-1 block text-xs font-semibold text-muted-foreground">
						Action
					</label>
					<select
						value={actionFilter}
						onChange={(event) => setActionFilter(event.target.value)}
						className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
					>
						<option value="">All actions</option>
						{actionOptions.map((action) => (
							<option key={action} value={action}>
								{action}
							</option>
						))}
					</select>
				</div>
				<div>
					<label className="mb-1 block text-xs font-semibold text-muted-foreground">
						Status
					</label>
					<select
						value={statusFilter}
						onChange={(event) => setStatusFilter(event.target.value as "" | AuditStatus)}
						className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
					>
						<option value="">All</option>
						<option value="success">Success</option>
						<option value="error">Error</option>
					</select>
				</div>
				<div>
					<label className="mb-1 block text-xs font-semibold text-muted-foreground">
						Actor Email
					</label>
					<input
						value={actorEmailFilter}
						onChange={(event) => setActorEmailFilter(event.target.value)}
						placeholder="admin@student.mahidol.edu"
						className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
					/>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="mb-1 block text-xs font-semibold text-muted-foreground">
							From
						</label>
						<input
							type="date"
							value={fromDate}
							onChange={(event) => setFromDate(event.target.value)}
							className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
						/>
					</div>
					<div>
						<label className="mb-1 block text-xs font-semibold text-muted-foreground">
							To
						</label>
						<input
							type="date"
							value={toDate}
							onChange={(event) => setToDate(event.target.value)}
							className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
						/>
					</div>
				</div>
				<div className="sm:col-span-2 lg:col-span-4 flex justify-end">
					<button
						type="button"
						onClick={() => void fetchLogs()}
						className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
					>
						Apply Filters
					</button>
				</div>
			</AdminFilterBar>

			{loading ? (
				<AdminCard>Loading logs...</AdminCard>
			) : entries.length === 0 ? (
				<AdminEmptyState
					title="No log entries found"
					description="Try broadening your filters."
				/>
			) : (
				<>
					<AdminTable
						headers={[
							"Time",
							"Actor",
							"Action",
							"Target",
							"Status",
							"HTTP",
							"Duration",
							"Details",
						]}
					>
						{entries.map((entry) => (
							<tr key={entry.id} className="align-top">
								<td className="px-4 py-3 text-muted-foreground">
									{entry.createdAt
										? new Date(entry.createdAt).toLocaleString()
										: "-"}
								</td>
								<td className="px-4 py-3">
									<div className="font-medium text-foreground">
										{entry.actorName || "Unknown"}
									</div>
									<div className="text-xs text-muted-foreground">
										{entry.actorEmail || "-"}
									</div>
								</td>
								<td className="px-4 py-3 text-foreground">
									<div className="font-medium">{entry.action}</div>
									<div className="text-xs text-muted-foreground">
										{entry.method} {entry.path}
									</div>
								</td>
								<td className="px-4 py-3 text-muted-foreground">
									{entry.resourceType}
									{entry.resourceId ? `:${entry.resourceId}` : ""}
								</td>
								<td className="px-4 py-3">
									<AdminStatusBadge
										variant={entry.status === "success" ? "success" : "error"}
										label={entry.status}
									/>
								</td>
								<td className="px-4 py-3 text-muted-foreground">{entry.httpStatus}</td>
								<td className="px-4 py-3 text-muted-foreground">
									{entry.durationMs}ms
								</td>
								<td className="px-4 py-3">
									<button
										type="button"
										onClick={() =>
											setExpandedId((previous) =>
												previous === entry.id ? null : entry.id
											)
										}
										className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-accent"
									>
										{expandedId === entry.id ? "Hide" : "Show"}
									</button>
								</td>
							</tr>
						))}
					</AdminTable>

					{expandedId ? (
						<AdminCard className="mt-4">
							<h3 className="mb-2 text-sm font-semibold text-foreground">Log Details</h3>
							<pre className="max-h-[420px] overflow-auto rounded-lg border border-border bg-secondary-background p-3 text-xs text-foreground">
								{JSON.stringify(
									entries.find((entry) => entry.id === expandedId) ?? {},
									null,
									2
								)}
							</pre>
						</AdminCard>
					) : null}

					{nextCursor ? (
						<div className="mt-4 flex justify-center">
							<button
								type="button"
								onClick={loadMore}
								disabled={loadingMore}
								className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
							>
								{loadingMore ? "Loading..." : "Load More"}
							</button>
						</div>
					) : null}
				</>
			)}
		</AdminShell>
	);
}
