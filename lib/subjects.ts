import { Subject } from "@/types";
import { subjectsService } from "@/lib/server/services/subjectsService";

export async function getAllSubjects(): Promise<Subject[]> {
	return subjectsService.getAllSubjects();
}
