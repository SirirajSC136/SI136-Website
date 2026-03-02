"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AdminCard from "@/components/admin/AdminCard";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminShell from "@/components/admin/AdminShell";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import NoticeBanner from "@/components/admin/NoticeBanner";

type AdminUser = {
	email: string;
	emailNormalized: string;
	name?: string;
	active: boolean;
	createdAt?: string;
	updatedAt?: string;
	createdByEmail?: string;
};

type NoticeState =
	| { type: "success" | "error" | "info"; message: string }
	| null;

export default function AdminManagementPage() {
	const [admins, setAdmins] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
		"all"
	);
	const [submitting, setSubmitting] = useState(false);
	const [notice, setNotice] = useState<NoticeState>(null);
	const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

	const activeAdminsCount = useMemo(
		() => admins.filter((admin) => admin.active).length,
		[admins]
	);

	const filteredAdmins = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		return admins.filter((admin) => {
			if (statusFilter === "active" && !admin.active) return false;
			if (statusFilter === "inactive" && admin.active) return false;
			if (!normalizedSearch) return true;
			return (
				admin.email.toLowerCase().includes(normalizedSearch) ||
				(admin.name ?? "").toLowerCase().includes(normalizedSearch)
			);
		});
	}, [admins, search, statusFilter]);

	const fetchAdmins = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/admin/admins", { cache: "no-store" });
			const payload = await response.json();
			if (!response.ok || !payload?.data) {
				throw new Error(payload?.error || "Failed to load admins");
			}
			setAdmins(payload.data);
		} catch (error) {
			setNotice({ type: "error", message: `Could not load admins: ${error}` });
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchAdmins();
	}, [fetchAdmins]);

	const handleAddAdmin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		setNotice(null);
		try {
			const response = await fetch("/api/admin/admins", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, name: name.trim() || undefined }),
			});
			const payload = await response.json();
			if (!response.ok || !payload?.data) {
				throw new Error(payload?.error || "Failed to save admin");
			}

			setEmail("");
			setName("");
			setNotice({ type: "success", message: "Admin saved successfully." });
			await fetchAdmins();
		} catch (error) {
			setNotice({ type: "error", message: `Could not save admin: ${error}` });
		} finally {
			setSubmitting(false);
		}
	};

	const removeAdmin = async () => {
		if (!deleteTarget) return;
		setNotice(null);
		try {
			const response = await fetch(
				`/api/admin/admins?email=${encodeURIComponent(deleteTarget.email)}`,
				{ method: "DELETE" }
			);
			const payload = await response.json();
			if (!response.ok) {
				throw new Error(payload?.error || "Failed to remove admin");
			}
			setNotice({ type: "success", message: "Admin removed." });
			await fetchAdmins();
		} catch (error) {
			setNotice({ type: "error", message: `Could not remove admin: ${error}` });
		} finally {
			setDeleteTarget(null);
		}
	};

	return (
		<AdminShell>
			<AdminPageHeader
				title="Admin Management"
				subtitle="Add, reactivate, and remove admin access backed by Firestore records."
			/>

			{notice ? <NoticeBanner type={notice.type} message={notice.message} /> : null}

			<AdminCard className="mb-4">
				<form onSubmit={handleAddAdmin} className="grid gap-3 md:grid-cols-3">
					<input
						type="email"
						required
						placeholder="student@student.mahidol.edu"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
					/>
					<input
						type="text"
						placeholder="Name (optional)"
						value={name}
						onChange={(event) => setName(event.target.value)}
						className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
					/>
					<button
						type="submit"
						disabled={submitting}
						className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{submitting ? "Saving..." : "Add / Reactivate Admin"}
					</button>
				</form>
			</AdminCard>

			<AdminFilterBar>
				<div className="sm:col-span-2">
					<label className="mb-1 block text-xs font-semibold text-muted-foreground">
						Search
					</label>
					<input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Search by name or email"
						className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
					/>
				</div>
				<div>
					<label className="mb-1 block text-xs font-semibold text-muted-foreground">
						Status
					</label>
					<select
						value={statusFilter}
						onChange={(event) =>
							setStatusFilter(event.target.value as "all" | "active" | "inactive")
						}
						className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
					>
						<option value="all">All</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</select>
				</div>
				<div className="flex items-end">
					<div className="rounded-lg border border-border bg-secondary-background px-3 py-2 text-sm text-muted-foreground">
						Active admins: <span className="font-semibold text-foreground">{activeAdminsCount}</span>
					</div>
				</div>
			</AdminFilterBar>

			{loading ? (
				<AdminCard>Loading admins...</AdminCard>
			) : filteredAdmins.length === 0 ? (
				<AdminEmptyState
					title="No admins found"
					description="Try changing filters or add a new admin."
				/>
			) : (
				<AdminTable
					headers={["Name", "Email", "Status", "Updated", "Created By", "Actions"]}
				>
					{filteredAdmins.map((admin) => {
						const isLastActive = admin.active && activeAdminsCount <= 1;
						return (
							<tr key={admin.emailNormalized} className="align-top">
								<td className="px-4 py-3 text-foreground">
									<div className="font-semibold">{admin.name || "Unnamed admin"}</div>
								</td>
								<td className="px-4 py-3 text-muted-foreground">{admin.email}</td>
								<td className="px-4 py-3">
									<AdminStatusBadge
										variant={admin.active ? "active" : "inactive"}
										label={admin.active ? "Active" : "Inactive"}
									/>
								</td>
								<td className="px-4 py-3 text-muted-foreground">
									{admin.updatedAt
										? new Date(admin.updatedAt).toLocaleString()
										: "-"}
								</td>
								<td className="px-4 py-3 text-muted-foreground">
									{admin.createdByEmail || "-"}
								</td>
								<td className="px-4 py-3">
									<button
										type="button"
										disabled={!admin.active || isLastActive}
										onClick={() => setDeleteTarget(admin)}
										className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
									>
										Remove Admin
									</button>
								</td>
							</tr>
						);
					})}
				</AdminTable>
			)}

			<ConfirmActionDialog
				open={deleteTarget !== null}
				title="Remove Admin Access"
				description={
					deleteTarget
						? `This will remove admin access for ${deleteTarget.email}.`
						: ""
				}
				confirmLabel="Remove"
				onCancel={() => setDeleteTarget(null)}
				onConfirm={removeAdmin}
			/>
		</AdminShell>
	);
}
