import {
	CollectionReference,
	DocumentData,
	DocumentReference,
	FieldPath,
	FieldValue,
	Firestore,
	QueryDocumentSnapshot,
	Timestamp,
} from "firebase-admin/firestore";
import { TopicItemData } from "@/types";
import { getFirestoreDb } from "@/lib/server/firebase/admin";
import {
	CourseKind,
	CourseRecord,
	CreateCourseInput,
	CreateInteractiveInput,
	CreateMaterialInput,
	CreateTopicInput,
	InteractiveContentRecord,
	MaterialRecord,
	TopicKind,
	TopicRecord,
} from "@/lib/server/types/content";
import { createCustomId, isCustomId } from "@/lib/server/utils/id";
import { HttpError } from "@/lib/server/http/errors";

type TopicDoc = {
	title: string;
	kind: TopicKind;
	createdAt?: FieldValue | Timestamp;
	updatedAt?: FieldValue | Timestamp;
};

type CourseDoc = {
	kind: CourseKind;
	courseCode: string;
	title: string;
	year: number;
	semester: number;
	createdAt?: FieldValue | Timestamp;
	updatedAt?: FieldValue | Timestamp;
};

type ItemDoc = {
	item: Partial<TopicItemData>;
	createdAt?: FieldValue | Timestamp;
	updatedAt?: FieldValue | Timestamp;
};

type InteractiveDoc = {
	courseId: string;
	title: string;
	contentType: "Quiz" | "Flashcard";
	content: unknown;
	createdAt?: FieldValue | Timestamp;
	updatedAt?: FieldValue | Timestamp;
};

function asIso(value: unknown): string | undefined {
	if (value instanceof Timestamp) {
		return value.toDate().toISOString();
	}
	return undefined;
}

function toCourseRecord(snapshot: QueryDocumentSnapshot<CourseDoc>): CourseRecord {
	const data = snapshot.data();
	return {
		id: snapshot.id,
		kind: data.kind,
		courseCode: data.courseCode,
		title: data.title,
		year: data.year,
		semester: data.semester,
		createdAt: asIso(data.createdAt),
		updatedAt: asIso(data.updatedAt),
	};
}

function toTopicRecord(snapshot: QueryDocumentSnapshot<TopicDoc>): TopicRecord {
	const data = snapshot.data();
	const parts = snapshot.ref.path.split("/");
	return {
		id: snapshot.id,
		courseId: parts[1],
		title: data.title,
		kind: data.kind ?? "custom",
		createdAt: asIso(data.createdAt),
		updatedAt: asIso(data.updatedAt),
	};
}

function toMaterialRecord(snapshot: QueryDocumentSnapshot<ItemDoc>): MaterialRecord {
	const parts = snapshot.ref.path.split("/");
	const courseId = parts[1];
	const topicId = parts[3];
	const data = snapshot.data();
	const rawItem = data.item ?? {};

	return {
		id: snapshot.id,
		courseId,
		topicId,
		item: {
			...rawItem,
			id: snapshot.id,
			title: rawItem.title ?? "Untitled",
			type: rawItem.type ?? "Link",
			isCustom: true,
		} as TopicItemData,
		createdAt: asIso(data.createdAt),
		updatedAt: asIso(data.updatedAt),
	};
}

function toInteractiveRecord(
	snapshot: QueryDocumentSnapshot<InteractiveDoc>
): InteractiveContentRecord {
	const data = snapshot.data();
	return {
		id: snapshot.id,
		courseId: data.courseId,
		title: data.title,
		contentType: data.contentType,
		content: data.content,
		createdAt: asIso(data.createdAt),
		updatedAt: asIso(data.updatedAt),
	};
}

async function commitDeleteRefs(
	db: Firestore,
	references: DocumentReference<DocumentData>[]
): Promise<void> {
	const chunkSize = 450;
	for (let index = 0; index < references.length; index += chunkSize) {
		const batch = db.batch();
		const refsChunk = references.slice(index, index + chunkSize);
		for (const ref of refsChunk) {
			batch.delete(ref);
		}
		await batch.commit();
	}
}

export class ContentRepository {
	private db: Firestore | null = null;
	private coursesRef: CollectionReference<CourseDoc> | null = null;
	private interactiveRef: CollectionReference<InteractiveDoc> | null = null;

	constructor(private readonly dbFactory: () => Firestore = getFirestoreDb) {}

	private getDb(): Firestore {
		if (!this.db) {
			this.db = this.dbFactory();
		}
		return this.db;
	}

	private getCoursesRef(): CollectionReference<CourseDoc> {
		if (!this.coursesRef) {
			this.coursesRef = this.getDb().collection("courses") as CollectionReference<CourseDoc>;
		}
		return this.coursesRef;
	}

	private getInteractiveRef(): CollectionReference<InteractiveDoc> {
		if (!this.interactiveRef) {
			this.interactiveRef = this.getDb().collection(
				"interactive_contents"
			) as CollectionReference<InteractiveDoc>;
		}
		return this.interactiveRef;
	}

	private topicsRef(courseId: string): CollectionReference<TopicDoc> {
		return this.getCoursesRef()
			.doc(courseId)
			.collection("topics") as CollectionReference<TopicDoc>;
	}

	private itemsRef(courseId: string, topicId: string): CollectionReference<ItemDoc> {
		return this.topicsRef(courseId).doc(topicId).collection("items") as CollectionReference<ItemDoc>;
	}

	private async ensureCourseForWrite(courseId: string): Promise<void> {
		const courseRef = this.getCoursesRef().doc(courseId);
		const existing = await courseRef.get();
		if (existing.exists) return;

		if (isCustomId(courseId)) {
			throw new HttpError(404, "Course not found", "course_not_found");
		}

		const now = FieldValue.serverTimestamp();
		await courseRef.set({
			kind: "overlay",
			courseCode: courseId,
			title: "Canvas Overlay",
			year: 0,
			semester: 0,
			createdAt: now,
			updatedAt: now,
		});
	}

	async listCustomCourses(): Promise<CourseRecord[]> {
		const snapshot = await this.getCoursesRef().where("kind", "==", "custom").get();
		return snapshot.docs
			.map(toCourseRecord)
			.sort((a, b) => b.year - a.year || b.semester - a.semester);
	}

	async getCourseById(courseId: string): Promise<CourseRecord | null> {
		const snapshot = await this.getCoursesRef().doc(courseId).get();
		if (!snapshot.exists) return null;
		const data = snapshot.data();
		if (!data) return null;
		return {
			id: snapshot.id,
			kind: data.kind,
			courseCode: data.courseCode,
			title: data.title,
			year: data.year,
			semester: data.semester,
			createdAt: asIso(data.createdAt),
			updatedAt: asIso(data.updatedAt),
		};
	}

	async createCustomCourse(input: CreateCourseInput): Promise<CourseRecord> {
		const existing = await this.getCoursesRef()
			.where("courseCode", "==", input.courseCode)
			.get();
		if (existing.docs.some((doc) => doc.data().kind === "custom")) {
			throw new HttpError(
				409,
				"A course with this code already exists.",
				"course_code_conflict"
			);
		}

		const id = createCustomId();
		const now = FieldValue.serverTimestamp();
		const payload: CourseDoc = {
			kind: "custom",
			courseCode: input.courseCode,
			title: input.title,
			year: input.year,
			semester: input.semester,
			createdAt: now,
			updatedAt: now,
		};
		await this.getCoursesRef().doc(id).set(payload);

		return {
			id,
			...input,
			kind: "custom",
		};
	}

	async deleteCourseCascade(courseId: string): Promise<boolean> {
		const courseRef = this.getCoursesRef().doc(courseId);
		const courseSnapshot = await courseRef.get();
		if (!courseSnapshot.exists) return false;

		const topicSnapshot = await this.topicsRef(courseId).get();
		const refsToDelete: DocumentReference<DocumentData>[] = [];

		for (const topic of topicSnapshot.docs) {
			const itemsSnapshot = await this.itemsRef(courseId, topic.id).get();
			for (const itemDoc of itemsSnapshot.docs) {
				refsToDelete.push(itemDoc.ref);
			}
			refsToDelete.push(topic.ref);
		}

		refsToDelete.push(courseRef);
		await commitDeleteRefs(this.getDb(), refsToDelete);
		return true;
	}

	async listTopicsForCourse(courseId: string): Promise<TopicRecord[]> {
		const snapshot = await this.topicsRef(courseId).get();
		return snapshot.docs.map(toTopicRecord);
	}

	async createTopic(input: CreateTopicInput): Promise<TopicRecord> {
		await this.ensureCourseForWrite(input.courseId);

		const id = createCustomId();
		const now = FieldValue.serverTimestamp();
		const payload: TopicDoc = {
			title: input.title,
			kind: "custom",
			createdAt: now,
			updatedAt: now,
		};
		await this.topicsRef(input.courseId).doc(id).set(payload);

		return {
			id,
			courseId: input.courseId,
			title: input.title,
			kind: "custom",
		};
	}

	async createOverlayTopicIfMissing(
		courseId: string,
		topicId: string,
		title = "Canvas Overlay Topic"
	): Promise<void> {
		await this.ensureCourseForWrite(courseId);
		const topicRef = this.topicsRef(courseId).doc(topicId);
		const snapshot = await topicRef.get();
		if (snapshot.exists) return;

		const now = FieldValue.serverTimestamp();
		await topicRef.set({
			title,
			kind: "overlay",
			createdAt: now,
			updatedAt: now,
		});
	}

	async deleteTopicCascadeById(topicId: string): Promise<boolean> {
		const topicMatch = await this.getDb()
			.collectionGroup("topics")
			.where(FieldPath.documentId(), "==", topicId)
			.limit(1)
			.get();

		if (topicMatch.empty) return false;

		const topicSnapshot = topicMatch.docs[0];
		const topicRef = topicSnapshot.ref;
		const courseId = topicRef.path.split("/")[1];
		const itemsSnapshot = await this.itemsRef(courseId, topicId).get();

		const refsToDelete: DocumentReference<DocumentData>[] = itemsSnapshot.docs.map(
			(itemDoc) => itemDoc.ref
		);
		refsToDelete.push(topicRef);
		await commitDeleteRefs(this.getDb(), refsToDelete);
		return true;
	}

	async listMaterialsForCourse(courseId: string): Promise<Map<string, TopicItemData[]>> {
		const topicSnapshot = await this.topicsRef(courseId).get();
		const result = new Map<string, TopicItemData[]>();

		for (const topicDoc of topicSnapshot.docs) {
			const itemsSnapshot = await this.itemsRef(courseId, topicDoc.id).get();
			const items = itemsSnapshot.docs.map((itemDoc) => toMaterialRecord(itemDoc).item);
			if (items.length > 0) {
				result.set(topicDoc.id, items);
			}
		}

		return result;
	}

	async createMaterial(input: CreateMaterialInput): Promise<MaterialRecord> {
		await this.createOverlayTopicIfMissing(input.courseId, input.topicId);

		const id = createCustomId();
		const now = FieldValue.serverTimestamp();
		const payload: ItemDoc = {
			item: { ...input.item, id: undefined, isCustom: true },
			createdAt: now,
			updatedAt: now,
		};
		await this.itemsRef(input.courseId, input.topicId).doc(id).set(payload);

		return {
			id,
			courseId: input.courseId,
			topicId: input.topicId,
			item: {
				...input.item,
				id,
				isCustom: true,
			},
		};
	}

	async updateMaterialById(itemId: string, item: TopicItemData): Promise<MaterialRecord | null> {
		const match = await this.getDb()
			.collectionGroup("items")
			.where(FieldPath.documentId(), "==", itemId)
			.limit(1)
			.get();
		if (match.empty) return null;

		const found = match.docs[0];
		await found.ref.update({
			item: { ...item, id: undefined, isCustom: true },
			updatedAt: FieldValue.serverTimestamp(),
		});

		const updated = await found.ref.get();
		if (!updated.exists) return null;
		return toMaterialRecord(updated as QueryDocumentSnapshot<ItemDoc>);
	}

	async deleteMaterialById(itemId: string): Promise<boolean> {
		const match = await this.getDb()
			.collectionGroup("items")
			.where(FieldPath.documentId(), "==", itemId)
			.limit(1)
			.get();

		if (match.empty) return false;
		await commitDeleteRefs(this.getDb(), [match.docs[0].ref]);
		return true;
	}

	async createInteractiveContent(
		input: CreateInteractiveInput
	): Promise<InteractiveContentRecord> {
		await this.ensureCourseForWrite(input.courseId);

		const id = createCustomId();
		const now = FieldValue.serverTimestamp();
		await this.getInteractiveRef().doc(id).set({
			...input,
			createdAt: now,
			updatedAt: now,
		});

		return {
			id,
			...input,
		};
	}

	async listInteractiveContentsForCourse(
		courseId: string
	): Promise<InteractiveContentRecord[]> {
		const snapshot = await this.getInteractiveRef()
			.where("courseId", "==", courseId)
			.get();
		return snapshot.docs.map(toInteractiveRecord);
	}
}

export const contentRepository = new ContentRepository();
