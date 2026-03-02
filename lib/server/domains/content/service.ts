import { TopicItemData } from "@/types";
import { contentRepository } from "@/lib/server/repositories/contentRepository";
import {
	CreateCourseInput,
	CreateInteractiveInput,
	CreateMaterialInput,
	CreateTopicInput,
	InteractiveContentRecord,
	MaterialRecord,
	CourseRecord,
	TopicRecord,
} from "@/lib/server/types/content";
import { HttpError } from "@/lib/server/http/errors";

export class AdminContentService {
	async createCourse(input: CreateCourseInput): Promise<CourseRecord> {
		return contentRepository.createCustomCourse(input);
	}

	async deleteCourse(courseId: string): Promise<void> {
		const deleted = await contentRepository.deleteCourseCascade(courseId);
		if (!deleted) {
			throw new HttpError(404, "Course not found", "course_not_found");
		}
	}

	async createTopic(input: CreateTopicInput): Promise<TopicRecord> {
		return contentRepository.createTopic(input);
	}

	async deleteTopic(topicId: string): Promise<void> {
		const deleted = await contentRepository.deleteTopicCascadeById(topicId);
		if (!deleted) {
			throw new HttpError(404, "Topic not found", "topic_not_found");
		}
	}

	async createMaterial(input: CreateMaterialInput): Promise<MaterialRecord> {
		return contentRepository.createMaterial(input);
	}

	async updateMaterial(itemId: string, item: TopicItemData): Promise<MaterialRecord> {
		const updated = await contentRepository.updateMaterialById(itemId, item);
		if (!updated) {
			throw new HttpError(404, "Material not found", "material_not_found");
		}
		return updated;
	}

	async deleteMaterial(itemId: string): Promise<void> {
		const deleted = await contentRepository.deleteMaterialById(itemId);
		if (!deleted) {
			throw new HttpError(404, "Material not found", "material_not_found");
		}
	}

	async createInteractiveContent(
		input: CreateInteractiveInput
	): Promise<InteractiveContentRecord> {
		return contentRepository.createInteractiveContent(input);
	}
}

export const adminContentService = new AdminContentService();
