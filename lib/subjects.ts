import { Subject } from "@/types";
import { subjectsService } from "@/lib/server/domains/subjects/service";
import { revalidateTag, unstable_cache } from "next/cache";

const SUBJECTS_LIST_TAG = "subjects:list";
const SUBJECTS_DETAIL_TAG_PREFIX = "subjects:detail:";
const SUBJECTS_REVALIDATE_SECONDS = 300;

function isSubjectCacheEnabled(): boolean {
	return process.env.USE_SUBJECT_CACHE !== "0";
}

const getAllSubjectsCached = unstable_cache(
	async () => subjectsService.getAllSubjects(),
	["subjects:list:v1"],
	{ revalidate: SUBJECTS_REVALIDATE_SECONDS, tags: [SUBJECTS_LIST_TAG] }
);

export async function getAllSubjects(): Promise<Subject[]> {
	if (!isSubjectCacheEnabled()) {
		return subjectsService.getAllSubjects();
	}
	return getAllSubjectsCached();
}

export async function getSubjectById(subjectId: string): Promise<Subject> {
	if (!isSubjectCacheEnabled()) {
		return subjectsService.getSubjectById(subjectId);
	}

	const detailTag = `${SUBJECTS_DETAIL_TAG_PREFIX}${subjectId}`;
	const getSubjectByIdCached = unstable_cache(
		async () => subjectsService.getSubjectById(subjectId),
		[`subjects:detail:${subjectId}:v1`],
		{ revalidate: SUBJECTS_REVALIDATE_SECONDS, tags: [detailTag] }
	);

	return getSubjectByIdCached();
}

export function revalidateSubjectsListCache(): void {
	if (!isSubjectCacheEnabled()) return;
	revalidateTag(SUBJECTS_LIST_TAG, "max");
}

export function revalidateSubjectDetailCache(subjectId: string): void {
	if (!isSubjectCacheEnabled()) return;
	revalidateTag(`${SUBJECTS_DETAIL_TAG_PREFIX}${subjectId}`, "max");
}
