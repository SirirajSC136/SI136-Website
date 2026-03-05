"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Subject } from "@/types";
import { Book, Edit, Globe, PlusCircle, Save, Trash2, X } from "lucide-react";
import AdminCard from "@/components/admin/AdminCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminShell from "@/components/admin/AdminShell";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import NoticeBanner from "@/components/admin/NoticeBanner";

type NewCoursePayload = {
	courseCode: string;
	title: string;
	year: number;
	semester: number;
};

type CreatedCourse = {
	id: string;
	courseCode: string;
	title: string;
	year: number;
	semester: number;
};

const NewCourseForm = ({
	onSave,
	onCancel,
}: {
	onSave: (payload: NewCoursePayload) => Promise<void>;
	onCancel: () => void;
}) => {
	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		await onSave({
			courseCode: String(formData.get("courseCode") ?? ""),
			title: String(formData.get("title") ?? ""),
			year: parseInt(String(formData.get("year") ?? "0"), 10),
			semester: parseInt(String(formData.get("semester") ?? "0"), 10),
		});
	};

	return (
		<form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
			<input
				name="courseCode"
				placeholder="Course Code (e.g., CUS101)"
				required
				className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
			/>
			<input
				name="title"
				placeholder="Course Title"
				required
				className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
			/>
			<input
				name="year"
				type="number"
				placeholder="Year (e.g., 2024)"
				required
				className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
			/>
			<input
				name="semester"
				type="number"
				placeholder="Semester (e.g., 1)"
				required
				className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
			/>
			<div className="md:col-span-2 flex flex-wrap gap-2">
				<button
					type="submit"
					className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
				>
					<Save size={16} /> Create Course
				</button>
				<button
					type="button"
					onClick={onCancel}
					className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
				>
					<X size={16} /> Cancel
				</button>
			</div>
		</form>
	);
};

function toSubject(course: CreatedCourse): Subject {
	return {
		_id: course.id,
		courseCode: course.courseCode,
		title: course.title,
		year: course.year,
		semester: course.semester,
		imageUrl: `/images/subjects/${course.id}.png`,
		canvasUrl: "",
		filesUrl: "",
		syllabus: "",
		topics: [],
	};
}

function sortSubjects(subjects: Subject[]): Subject[] {
	return [...subjects].sort(
		(a, b) =>
			b.year - a.year ||
			b.semester - a.semester ||
			a.courseCode.localeCompare(b.courseCode)
	);
}

export default function AdminCustomizeLandingPage() {
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [loading, setLoading] = useState(true);
	const [isDeletingCourse, setIsDeletingCourse] = useState(false);
	const [showNewCourseForm, setShowNewCourseForm] = useState(false);
	const [notice, setNotice] = useState<
		{ type: "success" | "error" | "info"; message: string } | null
	>(null);
	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		courseCode: string;
	} | null>(null);

	const fetchSubjects = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/subjects", { cache: "no-store" });
			if (!response.ok) throw new Error(`Failed with status ${response.status}`);
			const data = (await response.json()) as Subject[];
			setSubjects(sortSubjects(data));
		} catch (error) {
			setNotice({ type: "error", message: `Could not load subjects: ${error}` });
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchSubjects();
	}, [fetchSubjects]);

	const handleCreateCourse = async (courseData: NewCoursePayload) => {
		try {
			const response = await fetch("/api/admin/courses", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(courseData),
			});

			const payload = await response.json();
			if (!response.ok || !payload?.data) {
				throw new Error(payload?.error || "Failed to create course.");
			}

			setSubjects((previous) => sortSubjects([...previous, toSubject(payload.data)]));
			setShowNewCourseForm(false);
			setNotice({ type: "success", message: "Course created successfully." });
		} catch (error) {
			setNotice({ type: "error", message: `Could not create course: ${error}` });
			void fetchSubjects();
		}
	};

	const confirmDeleteCourse = async () => {
		if (!deleteTarget || isDeletingCourse) return;
		const target = deleteTarget;
		setDeleteTarget(null);
		setIsDeletingCourse(true);
		const previousSubjects = subjects;
		setSubjects((previous) =>
			previous.filter((subject) => subject._id !== target.id)
		);

		try {
			const response = await fetch(`/api/admin/courses?id=${target.id}`, {
				method: "DELETE",
			});
			if (!response.ok) {
				const payload = await response.json();
				throw new Error(payload?.error || "Failed to delete course.");
			}
			setNotice({ type: "success", message: "Course deleted successfully." });
		} catch (error) {
			setSubjects(previousSubjects);
			setNotice({ type: "error", message: `Could not delete course: ${error}` });
			void fetchSubjects();
		} finally {
			setIsDeletingCourse(false);
		}
	};

	return (
		<AdminShell>
			<AdminPageHeader
				title="Customize Courses"
				subtitle="Select a subject to manage materials, or create new custom courses."
				actions={
					<button
						onClick={() => setShowNewCourseForm((value) => !value)}
						className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
					>
						<PlusCircle size={16} />
						{showNewCourseForm ? "Hide Form" : "Create Custom Course"}
					</button>
				}
			/>

			{notice ? <NoticeBanner type={notice.type} message={notice.message} /> : null}

			{showNewCourseForm ? (
				<AdminCard className="mb-4">
					<h2 className="mb-3 text-lg font-semibold text-foreground">
						Create New Custom Course
					</h2>
					<NewCourseForm
						onSave={handleCreateCourse}
						onCancel={() => setShowNewCourseForm(false)}
					/>
				</AdminCard>
			) : null}

			{loading ? (
				<AdminCard>Loading subjects...</AdminCard>
			) : (
				<div className="rounded-xl border border-border bg-card shadow-sm">
					<ul className="divide-y divide-border">
						{subjects.map((subject) => (
							<li
								key={subject._id}
								className="group flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
							>
								<Link
									href={`/admin/customize/${subject._id}`}
									className="flex min-w-0 flex-1 items-center gap-4"
								>
									{subject.canvasUrl ? (
										<Globe size={20} className="shrink-0 text-muted-foreground" />
									) : (
										<Book size={20} className="shrink-0 text-blue-500" />
									)}
									<div className="min-w-0">
										<p className="truncate font-semibold text-foreground group-hover:text-emerald-600">
											{subject.courseCode} - {subject.title}
										</p>
										<p className="text-sm text-muted-foreground">
											Year {subject.year} · Semester {subject.semester}
										</p>
									</div>
								</Link>

								<div className="flex items-center gap-2">
									<Link
										href={`/admin/customize/${subject._id}`}
										className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
									>
										<Edit size={14} /> Customize
									</Link>
									{!subject.canvasUrl ? (
										<button
											disabled={isDeletingCourse}
											onClick={() =>
												setDeleteTarget({ id: subject._id, courseCode: subject.courseCode })
											}
											className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
											title={`Delete course ${subject.courseCode}`}
										>
											<Trash2 size={14} /> Delete
										</button>
									) : null}
								</div>
							</li>
						))}
					</ul>
				</div>
			)}

			<ConfirmActionDialog
				open={deleteTarget !== null}
				title="Delete Course"
				description={
					deleteTarget
						? `Delete "${deleteTarget.courseCode}" and all associated topics/materials? This cannot be undone.`
						: ""
				}
				confirmLabel="Delete Course"
				onCancel={() => !isDeletingCourse && setDeleteTarget(null)}
				onConfirm={confirmDeleteCourse}
			/>
		</AdminShell>
	);
}
