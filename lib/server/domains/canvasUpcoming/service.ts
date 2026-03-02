import Papa from "papaparse";

type SheetRow = Record<string, string>;

function parseCSV(csvText: string): SheetRow[] {
	if (!csvText || typeof csvText !== "string") {
		return [];
	}

	const result = Papa.parse<SheetRow>(csvText, {
		header: true,
		skipEmptyLines: true,
		transformHeader: (header: string) => header.trim(),
		transform: (value: string) => value.trim(),
	});

	if (result.errors.length > 0) {
		console.warn("CSV parsing had errors:", result.errors);
	}

	return result.data;
}

function parseDdMmYyyyDate(value: string): Date | null {
	const parts = value.split("/");
	if (parts.length !== 3) return null;

	const day = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10) - 1;
	const year = parseInt(parts[2], 10);
	const dt = new Date(year, month, day);
	return Number.isNaN(dt.getTime()) ? null : dt;
}

export async function getSecondUpcomingData() {
	const ASSIGNMENTS_SHEET_ID = "1omRhuSvS5qyXoXKRraKTJe0scagdxaWcENRGixja5cw";
	const EXAMS_SHEET_ID = "11RdWKC338mjIA7f9zxQQG1IWaW2XJZFtEZk3DbjJFso";
	const GID = "0";

	const assignmentsUrl = `https://docs.google.com/spreadsheets/d/${ASSIGNMENTS_SHEET_ID}/export?format=csv&gid=${GID}`;
	const examsUrl = `https://docs.google.com/spreadsheets/d/${EXAMS_SHEET_ID}/export?format=csv&gid=${GID}`;

	const [assignmentsResponse, examsResponse] = await Promise.all([
		fetch(assignmentsUrl, { next: { revalidate: 900 } }),
		fetch(examsUrl, { next: { revalidate: 900 } }),
	]);

	if (!assignmentsResponse.ok) {
		throw new Error(
			`Failed to fetch assignments sheet. Status: ${assignmentsResponse.status}`
		);
	}
	if (!examsResponse.ok) {
		throw new Error(`Failed to fetch exams sheet. Status: ${examsResponse.status}`);
	}

	const [assignmentsCsvText, examsCsvText] = await Promise.all([
		assignmentsResponse.text(),
		examsResponse.text(),
	]);

	const assignmentsData = parseCSV(assignmentsCsvText);
	const examsData = parseCSV(examsCsvText);

	const now = new Date();
	const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

	const filteredAssignments = assignmentsData.filter((item) => {
		const deadline = item["Deadline"];
		if (!deadline) return true;
		const itemDate = parseDdMmYyyyDate(deadline);
		if (!itemDate) return true;
		return itemDate >= threeDaysAgo;
	});

	const filteredExams = examsData.filter((item) => {
		const dateStr = item["Date"];
		if (!dateStr) return true;
		const itemDate = parseDdMmYyyyDate(dateStr);
		if (!itemDate) return true;
		return itemDate >= threeDaysAgo;
	});

	return {
		assignments: filteredAssignments,
		examinations: filteredExams,
	};
}

