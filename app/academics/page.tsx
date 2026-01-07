// app/academics/page.tsx

import AcademicHero from "@/app/components/academics/AcademicHero";
import SubjectCard from "@/app/components/academics/SubjectCard";
import { Subject } from "@/types";
import PageHero from "../components/main/PageHero";
import { BookHeart } from "lucide-react";

async function getSubjects(): Promise<Subject[]> {
	try {
		const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subjects`, {
			next: { revalidate: 900 },
		});

		if (!res.ok) {
			console.error("API responded with an error:", res.status);
			return [];
		}

		return res.json();
	} catch (error) {
		console.error("Failed to fetch subjects:", error);
		return [];
	}
}

// --- Normalization helper ---
function normalizeCourseCode(subject: Subject): Subject {
	// Explicit rules for patching
	if (subject.courseCode === "SIID143_68") {
		return {
			...subject,
			courseCode: "SIID 143/68",
		};
	}

	if (subject.courseCode === "SIID 144") {
		return {
			...subject,
			courseCode: "SIID 144/68",
			title: "SIID 144/68 Effective Learning",
		};
	}

	if (subject.courseCode === "ITCS") {
		return {
			...subject,
			courseCode: "ITCS 152",
			title:
				"ITCS 152/68 Information Technology and Trends for Future Health Care",
		};
	}

	if (subject.courseCode === "EGID103" || subject.courseCode === "EGID 103") {
		return {
			...subject,
			courseCode: "EGID 103/68",
			title: "EGID 103/68 Technology and Trends for Future Helthcare",
		};
	}

	return subject;
}

// --- Year/Semester hardcoding based on ID ---
const SEMESTER_1_IDS = ["1123", "432", "1104", "1106", "68db54ba5fe7ce53fdaa16de", "68e2bc91493704ef7977981c"];

function normalizeYearSemester(subject: Subject): Subject {
	const isSemester1 = SEMESTER_1_IDS.includes(subject._id);
	return {
		...subject,
		year: 1,
		semester: isSemester1 ? 1 : 2,
	};
}

const AcademicPage = async () => {
	const allSubjects = await getSubjects();

	// Exclude unwanted IDs
	const excludedIdList = ["1266", "208", "549", "1105"];
	const filtered = allSubjects.filter(
		(subject) => !excludedIdList.includes(subject._id)
	);

	// Normalize course codes and year/semester
	const subjects = filtered.map(normalizeCourseCode).map(normalizeYearSemester);

	// Log all subjects for hardcoding decisions
	console.log("=== ALL SUBJECTS ===");
	subjects.forEach(s => {
		console.log(`ID: ${s._id} | Code: ${s.courseCode} | Title: ${s.title} | Year: ${s.year} | Semester: ${s.semester}`);
	});
	console.log("====================");

	if (!subjects || subjects.length === 0) {
		return (
			<div className="bg-white">
				<AcademicHero />
				<main className="container mx-auto px-4 py-16 text-center">
					<h2 className="text-2xl font-bold text-slate-800">
						No subjects found.
					</h2>
					<p className="text-slate-600 mt-2">
						The API might be returning an empty list, or there was an issue
						fetching the data.
					</p>
				</main>
			</div>
		);
	}

	// Group by year and semester
	const groupedSubjects = subjects.reduce((acc, subject) => {
		const yearKey = `Year ${subject.year}`;
		const semesterKey = `Semester ${subject.semester}`;
		if (!acc[yearKey]) acc[yearKey] = {};
		if (!acc[yearKey][semesterKey]) acc[yearKey][semesterKey] = [];
		acc[yearKey][semesterKey].push(subject);
		return acc;
	}, {} as Record<string, Record<string, Subject[]>>);

	return (
		<div className="bg-background">
			<PageHero
				title="Academics Resources"
				subtitle="แหล่งความรู้สำหรับนักศึกษาแพทย์ศิริราช"
				link="https://forms.gle/tC41NLtj9S6jTB7j8"
				linkDisplay="Donate Resource"
				icon="BookHeart"
			/>
			<main className="container mx-auto px-4 py-16">
				{Object.entries(groupedSubjects)
					.sort((a, b) => b[0].localeCompare(a[0])) // Year descending (Year 2 before Year 1)
					.map(([year, semesters]) => (
						<section key={year} className="mb-16">
							<div className="relative text-center mb-10">
								<h2 className="text-4xl font-bold text-primary">{year}</h2>
								<div className="absolute inset-x-0 top-1/2 -z-10 h-px -translate-y-1/2 bg-secondary-background"></div>
							</div>
							{Object.entries(semesters)
								.sort((a, b) => b[0].localeCompare(a[0])) // Semester descending (Sem 2 before Sem 1)
								.map(([semester, subjectList]) => (
									<div key={semester} className="mt-4">
										<h3 className="mb-8 text-center text-2xl font-semibold text-secondary">
											{semester}
										</h3>
										<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
											{subjectList.map((subject) => (
												<SubjectCard key={subject._id} subject={subject} />
											))}
										</div>
									</div>
								))}
						</section>
					))}
			</main>
		</div>
	);
};

export default AcademicPage;
