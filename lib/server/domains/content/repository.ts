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
import { FlashcardContent, QuizContent, Subject, Topic, TopicItemData } from "@/types";
import { getFirestoreDb } from "@/lib/server/integrations/firebase/admin";
import {
	CourseKind,
	CourseRecord,
	CreateCourseInput,
	CreateInteractiveInput,
	CreateMaterialInput,
	CreateTopicInput,
	InteractiveContentRecord,
	MaterialRecord,
	SubjectCatalogCourseSummary,
	SubjectCatalogDoc,
	TopicKind,
	TopicRecord,
} from "@/lib/server/domains/content/types";
import { createCustomId, isCustomId } from "@/lib/server/domains/content/ids";
import { HttpError } from "@/lib/server/core/errors";
import {
	mapCustomCourseToSubject,
} from "@/lib/server/domains/subjects/mappers/customToSubject";

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
	courseId?: string;
	topicId?: string;
	item: Partial<TopicItemData>;
	createdAt?: FieldValue | Timestamp;
	updatedAt?: FieldValue | Timestamp;
};

type InteractiveDoc = {
	courseId: string;
	topicId: string;
	title: string;
	contentType: "Quiz" | "Flashcard";
	version: number;
	content: QuizContent | FlashcardContent;
	createdAt?: FieldValue | Timestamp;
	updatedAt?: FieldValue | Timestamp;
};

type SubjectViewStoredDoc = {
	subject: Subject;
	source: "projection";
	updatedAt?: FieldValue | Timestamp;
};

type SubjectCatalogStoredDoc = {
	courses: SubjectCatalogCourseSummary[];
	updatedAt?: FieldValue | Timestamp;
};

export type TopicDeleteResult = {
	deleted: boolean;
	courseId?: string;
};

export type MaterialDeleteResult = {
	deleted: boolean;
	courseId?: string;
	topicId?: string;
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

function toStorageItem(item: TopicItemData): Partial<TopicItemData> {
	return {
		...item,
		id: undefined,
		isCustom: true,
	};
}

function materialRecordFromStored(
	courseId: string,
	topicId: string,
	itemId: string,
	stored: Partial<TopicItemData>,
	createdAt?: unknown,
	updatedAt?: unknown
): MaterialRecord {
	return {
		id: itemId,
		courseId,
		topicId,
		item: {
			...stored,
			id: itemId,
			title: stored.title ?? "Untitled",
			type: stored.type ?? "Link",
			isCustom: true,
		} as TopicItemData,
		createdAt: asIso(createdAt),
		updatedAt: asIso(updatedAt),
	};
}

function toMaterialRecord(snapshot: QueryDocumentSnapshot<ItemDoc>): MaterialRecord {
	const parts = snapshot.ref.path.split("/");
	const fallbackCourseId = parts[1];
	const fallbackTopicId = parts[3];
	const data = snapshot.data();
	const courseId = data.courseId ?? fallbackCourseId;
	const topicId = data.topicId ?? fallbackTopicId;
	return materialRecordFromStored(
		courseId,
		topicId,
		snapshot.id,
		data.item ?? {},
		data.createdAt,
		data.updatedAt
	);
}

function toInteractiveRecord(
	snapshot: QueryDocumentSnapshot<InteractiveDoc>
): InteractiveContentRecord {
	const data = snapshot.data();
	return {
		id: snapshot.id,
		courseId: data.courseId,
		topicId: data.topicId,
		title: data.title,
		contentType: data.contentType,
		version: data.version,
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

function isProjectionEnabled(): boolean {
	return process.env.USE_SUBJECT_PROJECTIONS !== "0";
}

function shouldLogFirestoreCost(): boolean {
	return process.env.FIRESTORE_COST_LOGGING === "1";
}

function summarizeCustomCourses(courses: CourseRecord[]): SubjectCatalogCourseSummary[] {
	return courses
		.filter((course) => course.kind === "custom")
		.map((course) => ({
			id: course.id,
			courseCode: course.courseCode,
			title: course.title,
			year: course.year,
			semester: course.semester,
		}))
		.sort((a, b) => b.year - a.year || b.semester - a.semester);
}

function mergeCustomItemsIntoTopics(
	topics: Topic[],
	itemsMap: Map<string, TopicItemData[]>
): Topic[] {
	return topics.map((topic) => {
		const customItems = itemsMap.get(topic.id);
		if (!customItems || customItems.length === 0) return topic;
		return {
			...topic,
			items: [...topic.items, ...customItems],
		};
	});
}

export class ContentRepository {
	private db: Firestore | null = null;
	private coursesRef: CollectionReference<CourseDoc> | null = null;
	private interactiveRef: CollectionReference<InteractiveDoc> | null = null;
	private subjectViewsRef: CollectionReference<SubjectViewStoredDoc> | null = null;
	private courseExistsCache = new Map<string, number>();
	private topicExistsCache = new Map<string, number>();
	private readonly existenceCacheTtlMs = 60_000;

	constructor(private readonly dbFactory: () => Firestore = getFirestoreDb) {}

	private logCost(
		operation: string,
		reads: number,
		writes: number,
		durationMs: number,
		extra?: Record<string, unknown>
	): void {
		if (!shouldLogFirestoreCost()) return;
		console.info("[firestore-cost]", {
			operation,
			reads,
			writes,
			durationMs,
			...(extra ?? {}),
		});
	}

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

	private getSubjectViewsRef(): CollectionReference<SubjectViewStoredDoc> {
		if (!this.subjectViewsRef) {
			this.subjectViewsRef = this.getDb().collection(
				"subject_views"
			) as CollectionReference<SubjectViewStoredDoc>;
		}
		return this.subjectViewsRef;
	}

	private getSubjectCatalogRef(): DocumentReference<SubjectCatalogStoredDoc> {
		return this.getDb()
			.collection("subject_catalog")
			.doc("custom_courses") as DocumentReference<SubjectCatalogStoredDoc>;
	}

	private topicsRef(courseId: string): CollectionReference<TopicDoc> {
		return this.getCoursesRef()
			.doc(courseId)
			.collection("topics") as CollectionReference<TopicDoc>;
	}

	private itemsRef(courseId: string, topicId: string): CollectionReference<ItemDoc> {
		return this.topicsRef(courseId)
			.doc(topicId)
			.collection("items") as CollectionReference<ItemDoc>;
	}

	private rememberCourseExists(courseId: string): void {
		this.courseExistsCache.set(courseId, Date.now() + this.existenceCacheTtlMs);
	}

	private isCourseExistenceFresh(courseId: string): boolean {
		const expiresAt = this.courseExistsCache.get(courseId);
		if (!expiresAt) return false;
		if (expiresAt < Date.now()) {
			this.courseExistsCache.delete(courseId);
			return false;
		}
		return true;
	}

	private topicCacheKey(courseId: string, topicId: string): string {
		return `${courseId}:${topicId}`;
	}

	private rememberTopicExists(courseId: string, topicId: string): void {
		this.topicExistsCache.set(
			this.topicCacheKey(courseId, topicId),
			Date.now() + this.existenceCacheTtlMs
		);
	}

	private isTopicExistenceFresh(courseId: string, topicId: string): boolean {
		const key = this.topicCacheKey(courseId, topicId);
		const expiresAt = this.topicExistsCache.get(key);
		if (!expiresAt) return false;
		if (expiresAt < Date.now()) {
			this.topicExistsCache.delete(key);
			return false;
		}
		return true;
	}

	private async ensureCourseForWrite(courseId: string): Promise<void> {
		if (this.isCourseExistenceFresh(courseId)) return;

		const startedAt = Date.now();
		const courseRef = this.getCoursesRef().doc(courseId);
		const existing = await courseRef.get();
		if (existing.exists) {
			this.rememberCourseExists(courseId);
			this.logCost("ensureCourseForWrite", 1, 0, Date.now() - startedAt, {
				courseId,
				action: "exists",
			});
			return;
		}

		if (isCustomId(courseId)) {
			this.logCost("ensureCourseForWrite", 1, 0, Date.now() - startedAt, {
				courseId,
				action: "not_found_custom",
			});
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
		this.rememberCourseExists(courseId);
		this.logCost("ensureCourseForWrite", 1, 1, Date.now() - startedAt, {
			courseId,
			action: "created_overlay",
		});
	}

	async listCustomCourses(): Promise<CourseRecord[]> {
		const startedAt = Date.now();
		const snapshot = await this.getCoursesRef().where("kind", "==", "custom").get();
		this.logCost("listCustomCourses", snapshot.size, 0, Date.now() - startedAt);
		return snapshot.docs
			.map(toCourseRecord)
			.sort((a, b) => b.year - a.year || b.semester - a.semester);
	}

	async getCourseById(courseId: string): Promise<CourseRecord | null> {
		const startedAt = Date.now();
		const snapshot = await this.getCoursesRef().doc(courseId).get();
		this.logCost("getCourseById", 1, 0, Date.now() - startedAt, { courseId });
		if (!snapshot.exists) return null;
		const data = snapshot.data();
		if (!data) return null;
		this.rememberCourseExists(courseId);
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
		const startedAt = Date.now();
		const existing = await this.getCoursesRef()
			.where("courseCode", "==", input.courseCode)
			.get();
		if (existing.docs.some((doc) => doc.data().kind === "custom")) {
			this.logCost("createCustomCourse", existing.size, 0, Date.now() - startedAt, {
				courseCode: input.courseCode,
				action: "conflict",
			});
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
		this.rememberCourseExists(id);
		this.logCost("createCustomCourse", existing.size, 1, Date.now() - startedAt, {
			courseId: id,
		});

		return {
			id,
			...input,
			kind: "custom",
		};
	}

	async deleteCourseCascade(courseId: string): Promise<boolean> {
		const startedAt = Date.now();
		const courseRef = this.getCoursesRef().doc(courseId);
		const courseSnapshot = await courseRef.get();
		if (!courseSnapshot.exists) {
			this.logCost("deleteCourseCascade", 1, 0, Date.now() - startedAt, {
				courseId,
				action: "not_found",
			});
			return false;
		}

		const topicSnapshot = await this.topicsRef(courseId).get();
		const refsToDelete: DocumentReference<DocumentData>[] = [];
		let itemReads = 0;

		for (const topic of topicSnapshot.docs) {
			const itemsSnapshot = await this.itemsRef(courseId, topic.id).get();
			itemReads += itemsSnapshot.size;
			for (const itemDoc of itemsSnapshot.docs) {
				refsToDelete.push(itemDoc.ref);
			}
			refsToDelete.push(topic.ref);
		}

		refsToDelete.push(courseRef);
		await commitDeleteRefs(this.getDb(), refsToDelete);
		this.courseExistsCache.delete(courseId);
		this.logCost(
			"deleteCourseCascade",
			1 + topicSnapshot.size + itemReads,
			refsToDelete.length,
			Date.now() - startedAt,
			{ courseId }
		);
		return true;
	}

	async listTopicsForCourse(courseId: string): Promise<TopicRecord[]> {
		const startedAt = Date.now();
		const snapshot = await this.topicsRef(courseId).get();
		this.logCost("listTopicsForCourse", snapshot.size, 0, Date.now() - startedAt, {
			courseId,
		});
		for (const topic of snapshot.docs) {
			this.rememberTopicExists(courseId, topic.id);
		}
		return snapshot.docs.map(toTopicRecord);
	}

	async createTopic(input: CreateTopicInput): Promise<TopicRecord> {
		const startedAt = Date.now();
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
		this.rememberTopicExists(input.courseId, id);
		this.logCost("createTopic", 1, 1, Date.now() - startedAt, {
			courseId: input.courseId,
			topicId: id,
		});

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
		if (this.isTopicExistenceFresh(courseId, topicId)) {
			return;
		}

		const startedAt = Date.now();
		await this.ensureCourseForWrite(courseId);
		const topicRef = this.topicsRef(courseId).doc(topicId);
		const snapshot = await topicRef.get();
		if (snapshot.exists) {
			this.rememberTopicExists(courseId, topicId);
			this.logCost("createOverlayTopicIfMissing", 1, 0, Date.now() - startedAt, {
				courseId,
				topicId,
				action: "exists",
			});
			return;
		}

		const now = FieldValue.serverTimestamp();
		await topicRef.set({
			title,
			kind: "overlay",
			createdAt: now,
			updatedAt: now,
		});
		this.rememberTopicExists(courseId, topicId);
		this.logCost("createOverlayTopicIfMissing", 1, 1, Date.now() - startedAt, {
			courseId,
			topicId,
			action: "created",
		});
	}

	async deleteTopicCascadeByIdInCourse(
		courseId: string,
		topicId: string
	): Promise<TopicDeleteResult> {
		const startedAt = Date.now();
		const topicRef = this.topicsRef(courseId).doc(topicId);
		const topicSnapshot = await topicRef.get();
		if (!topicSnapshot.exists) {
			this.logCost("deleteTopicCascadeByIdInCourse", 1, 0, Date.now() - startedAt, {
				courseId,
				topicId,
				action: "not_found",
			});
			return { deleted: false };
		}

		const itemsSnapshot = await this.itemsRef(courseId, topicId).get();
		const refsToDelete: DocumentReference<DocumentData>[] = itemsSnapshot.docs.map(
			(itemDoc) => itemDoc.ref
		);
		refsToDelete.push(topicRef);
		await commitDeleteRefs(this.getDb(), refsToDelete);
		this.topicExistsCache.delete(this.topicCacheKey(courseId, topicId));
		this.logCost(
			"deleteTopicCascadeByIdInCourse",
			1 + itemsSnapshot.size,
			refsToDelete.length,
			Date.now() - startedAt,
			{ courseId, topicId }
		);
		return { deleted: true, courseId };
	}

	async deleteTopicCascadeById(topicId: string): Promise<TopicDeleteResult> {
		const startedAt = Date.now();
		const topicMatch = await this.getDb()
			.collectionGroup("topics")
			.where(FieldPath.documentId(), "==", topicId)
			.limit(1)
			.get();

		if (topicMatch.empty) {
			this.logCost("deleteTopicCascadeById", 1, 0, Date.now() - startedAt, {
				topicId,
				action: "not_found",
			});
			return { deleted: false };
		}

		const topicSnapshot = topicMatch.docs[0];
		const topicRef = topicSnapshot.ref;
		const courseId = topicRef.path.split("/")[1];
		const itemsSnapshot = await this.itemsRef(courseId, topicId).get();

		const refsToDelete: DocumentReference<DocumentData>[] = itemsSnapshot.docs.map(
			(itemDoc) => itemDoc.ref
		);
		refsToDelete.push(topicRef);
		await commitDeleteRefs(this.getDb(), refsToDelete);
		this.topicExistsCache.delete(this.topicCacheKey(courseId, topicId));
		this.logCost(
			"deleteTopicCascadeById",
			1 + itemsSnapshot.size,
			refsToDelete.length,
			Date.now() - startedAt,
			{ courseId, topicId }
		);
		return { deleted: true, courseId };
	}

	async listMaterialsForCourse(
		courseId: string,
		topicIds?: string[]
	): Promise<Map<string, TopicItemData[]>> {
		const startedAt = Date.now();
		const topicSnapshot = topicIds
			? null
			: await this.topicsRef(courseId).get();
		const topicsToScan = topicIds ?? topicSnapshot?.docs.map((topicDoc) => topicDoc.id) ?? [];
		const result = new Map<string, TopicItemData[]>();
		let readItems = 0;

		for (const topicId of topicsToScan) {
			const itemsSnapshot = await this.itemsRef(courseId, topicId).get();
			readItems += itemsSnapshot.size;
			const items = itemsSnapshot.docs.map((itemDoc) => toMaterialRecord(itemDoc).item);
			if (items.length > 0) {
				result.set(topicId, items);
			}
		}

		this.logCost(
			"listMaterialsForCourse",
			(topicSnapshot?.size ?? 0) + readItems,
			0,
			Date.now() - startedAt,
			{ courseId, providedTopicIds: Boolean(topicIds) }
		);
		return result;
	}

	async createMaterial(input: CreateMaterialInput): Promise<MaterialRecord> {
		const startedAt = Date.now();
		await this.createOverlayTopicIfMissing(input.courseId, input.topicId);

		const id = input.itemId ?? createCustomId();
		if (!isCustomId(id)) {
			throw new HttpError(400, "Invalid Item ID format", "validation_error");
		}
		const now = FieldValue.serverTimestamp();
		const normalizedItem: TopicItemData =
			input.item.type === "Quiz" || input.item.type === "Flashcard"
				? { ...input.item, interactiveRefId: id }
				: input.item;
		const payload: ItemDoc = {
			courseId: input.courseId,
			topicId: input.topicId,
			item: toStorageItem(normalizedItem),
			createdAt: now,
			updatedAt: now,
		};
		const itemRef = this.itemsRef(input.courseId, input.topicId).doc(id);
		const existingItem = await itemRef.get();
		if (existingItem.exists) {
			throw new HttpError(409, "Item ID already exists", "item_conflict");
		}
		await itemRef.set(payload);
		this.rememberCourseExists(input.courseId);
		this.rememberTopicExists(input.courseId, input.topicId);
		this.logCost("createMaterial", 2, 1, Date.now() - startedAt, {
			courseId: input.courseId,
			topicId: input.topicId,
			itemId: id,
		});

		return {
			id,
			courseId: input.courseId,
			topicId: input.topicId,
			item: {
				...normalizedItem,
				id,
				isCustom: true,
			},
		};
	}

	async updateMaterialByIdInTopic(
		courseId: string,
		topicId: string,
		itemId: string,
		item: TopicItemData
	): Promise<MaterialRecord | null> {
		const startedAt = Date.now();
		const itemRef = this.itemsRef(courseId, topicId).doc(itemId);
		const existing = await itemRef.get();
		if (!existing.exists) {
			this.logCost("updateMaterialByIdInTopic", 1, 0, Date.now() - startedAt, {
				courseId,
				topicId,
				itemId,
				action: "not_found",
			});
			return null;
		}

		const nextStoredItem = toStorageItem(item);
		const currentStoredItem = (existing.data() as ItemDoc | undefined)?.item ?? {};
		if (JSON.stringify(currentStoredItem) === JSON.stringify(nextStoredItem)) {
			this.logCost("updateMaterialByIdInTopic", 1, 0, Date.now() - startedAt, {
				courseId,
				topicId,
				itemId,
				action: "no_op",
			});
			return materialRecordFromStored(
				courseId,
				topicId,
				itemId,
				currentStoredItem,
				existing.data()?.createdAt,
				existing.data()?.updatedAt
			);
		}

		await itemRef.update({
			courseId,
			topicId,
			item: nextStoredItem,
			updatedAt: FieldValue.serverTimestamp(),
		});

		this.logCost("updateMaterialByIdInTopic", 1, 1, Date.now() - startedAt, {
			courseId,
			topicId,
			itemId,
		});
		return {
			id: itemId,
			courseId,
			topicId,
			item: {
				...item,
				id: itemId,
				isCustom: true,
			},
		};
	}

	async updateMaterialById(itemId: string, item: TopicItemData): Promise<MaterialRecord | null> {
		const startedAt = Date.now();
		const match = await this.getDb()
			.collectionGroup("items")
			.where(FieldPath.documentId(), "==", itemId)
			.limit(1)
			.get();
		if (match.empty) {
			this.logCost("updateMaterialById", 1, 0, Date.now() - startedAt, {
				itemId,
				action: "not_found",
			});
			return null;
		}

		const found = match.docs[0];
		const parts = found.ref.path.split("/");
		const courseId = parts[1];
		const topicId = parts[3];
		const nextStoredItem = toStorageItem(item);
		const currentStoredItem = (found.data() as ItemDoc | undefined)?.item ?? {};
		if (JSON.stringify(currentStoredItem) === JSON.stringify(nextStoredItem)) {
			this.logCost("updateMaterialById", 1, 0, Date.now() - startedAt, {
				courseId,
				topicId,
				itemId,
				action: "no_op",
			});
			return materialRecordFromStored(
				courseId,
				topicId,
				itemId,
				currentStoredItem,
				found.data().createdAt,
				found.data().updatedAt
			);
		}

		await found.ref.update({
			courseId,
			topicId,
			item: nextStoredItem,
			updatedAt: FieldValue.serverTimestamp(),
		});
		this.logCost("updateMaterialById", 1, 1, Date.now() - startedAt, {
			courseId,
			topicId,
			itemId,
		});

		return {
			id: itemId,
			courseId,
			topicId,
			item: {
				...item,
				id: itemId,
				isCustom: true,
			},
		};
	}

	async deleteMaterialByIdInTopic(
		courseId: string,
		topicId: string,
		itemId: string
	): Promise<MaterialDeleteResult> {
		const startedAt = Date.now();
		const itemRef = this.itemsRef(courseId, topicId).doc(itemId);
		const itemSnapshot = await itemRef.get();
		if (!itemSnapshot.exists) {
			this.logCost("deleteMaterialByIdInTopic", 1, 0, Date.now() - startedAt, {
				courseId,
				topicId,
				itemId,
				action: "not_found",
			});
			return { deleted: false };
		}
		await commitDeleteRefs(this.getDb(), [itemRef]);
		this.logCost("deleteMaterialByIdInTopic", 1, 1, Date.now() - startedAt, {
			courseId,
			topicId,
			itemId,
		});
		return { deleted: true, courseId, topicId };
	}

	async deleteMaterialById(itemId: string): Promise<MaterialDeleteResult> {
		const startedAt = Date.now();
		const match = await this.getDb()
			.collectionGroup("items")
			.where(FieldPath.documentId(), "==", itemId)
			.limit(1)
			.get();

		if (match.empty) {
			this.logCost("deleteMaterialById", 1, 0, Date.now() - startedAt, {
				itemId,
				action: "not_found",
			});
			return { deleted: false };
		}
		const found = match.docs[0];
		const parts = found.ref.path.split("/");
		const courseId = parts[1];
		const topicId = parts[3];
		await commitDeleteRefs(this.getDb(), [found.ref]);
		this.logCost("deleteMaterialById", 1, 1, Date.now() - startedAt, {
			courseId,
			topicId,
			itemId,
		});
		return { deleted: true, courseId, topicId };
	}

	async createInteractiveContent(
		input: CreateInteractiveInput
	): Promise<InteractiveContentRecord> {
		const startedAt = Date.now();
		await this.ensureCourseForWrite(input.courseId);

		const id = input.itemId;
		const now = FieldValue.serverTimestamp();
		await this.getInteractiveRef().doc(id).set({
			courseId: input.courseId,
			topicId: input.topicId,
			title: input.title,
			contentType: input.contentType,
			version: 1,
			content: input.content,
			createdAt: now,
			updatedAt: now,
		});
		this.logCost("createInteractiveContent", 1, 1, Date.now() - startedAt, {
			courseId: input.courseId,
			interactiveId: id,
		});

		return {
			id,
			courseId: input.courseId,
			topicId: input.topicId,
			title: input.title,
			contentType: input.contentType,
			version: 1,
			content: input.content,
		};
	}

	async listInteractiveContentsForCourse(
		courseId: string
	): Promise<InteractiveContentRecord[]> {
		const startedAt = Date.now();
		const snapshot = await this.getInteractiveRef()
			.where("courseId", "==", courseId)
			.get();
		this.logCost(
			"listInteractiveContentsForCourse",
			snapshot.size,
			0,
			Date.now() - startedAt,
			{ courseId }
		);
		return snapshot.docs.map(toInteractiveRecord);
	}

	async getSubjectView(subjectId: string): Promise<Subject | null> {
		if (!isProjectionEnabled()) return null;
		const startedAt = Date.now();
		const snapshot = await this.getSubjectViewsRef().doc(subjectId).get();
		this.logCost("getSubjectView", 1, 0, Date.now() - startedAt, { subjectId });
		if (!snapshot.exists) return null;
		const data = snapshot.data();
		if (!data?.subject) return null;
		return data.subject;
	}

	async upsertSubjectView(subjectId: string, subject: Subject): Promise<void> {
		if (!isProjectionEnabled()) return;
		const startedAt = Date.now();
		await this.getSubjectViewsRef().doc(subjectId).set({
			subject,
			source: "projection",
			updatedAt: FieldValue.serverTimestamp(),
		});
		this.logCost("upsertSubjectView", 0, 1, Date.now() - startedAt, { subjectId });
	}

	async deleteSubjectView(subjectId: string): Promise<void> {
		if (!isProjectionEnabled()) return;
		const startedAt = Date.now();
		await this.getSubjectViewsRef().doc(subjectId).delete();
		this.logCost("deleteSubjectView", 0, 1, Date.now() - startedAt, { subjectId });
	}

	async getSubjectCatalog(): Promise<SubjectCatalogDoc | null> {
		if (!isProjectionEnabled()) return null;
		const startedAt = Date.now();
		const snapshot = await this.getSubjectCatalogRef().get();
		this.logCost("getSubjectCatalog", 1, 0, Date.now() - startedAt);
		if (!snapshot.exists) return null;
		const data = snapshot.data();
		if (!data) return null;
		return {
			courses: Array.isArray(data.courses) ? data.courses : [],
			updatedAt: asIso(data.updatedAt),
		};
	}

	async upsertCustomCourseInCatalog(course: CourseRecord): Promise<void> {
		if (!isProjectionEnabled() || course.kind !== "custom") return;
		const startedAt = Date.now();
		const catalogRef = this.getSubjectCatalogRef();
		const snapshot = await catalogRef.get();
		const existingCourses = snapshot.exists
			? (snapshot.data()?.courses ?? [])
			: [];
		const filtered = existingCourses.filter((entry) => entry.id !== course.id);
		filtered.push({
			id: course.id,
			courseCode: course.courseCode,
			title: course.title,
			year: course.year,
			semester: course.semester,
		});
		filtered.sort((a, b) => b.year - a.year || b.semester - a.semester);
		await catalogRef.set({
			courses: filtered,
			updatedAt: FieldValue.serverTimestamp(),
		});
		this.logCost("upsertCustomCourseInCatalog", 1, 1, Date.now() - startedAt, {
			courseId: course.id,
		});
	}

	async removeCustomCourseFromCatalog(courseId: string): Promise<void> {
		if (!isProjectionEnabled()) return;
		const startedAt = Date.now();
		const catalogRef = this.getSubjectCatalogRef();
		const snapshot = await catalogRef.get();
		if (!snapshot.exists) {
			this.logCost("removeCustomCourseFromCatalog", 1, 0, Date.now() - startedAt, {
				courseId,
				action: "no_catalog",
			});
			return;
		}
		const existingCourses = snapshot.data()?.courses ?? [];
		const filtered = existingCourses.filter((entry) => entry.id !== courseId);
		await catalogRef.set({
			courses: filtered,
			updatedAt: FieldValue.serverTimestamp(),
		});
		this.logCost("removeCustomCourseFromCatalog", 1, 1, Date.now() - startedAt, {
			courseId,
		});
	}

	async rebuildCustomCourseSubjectView(courseId: string): Promise<void> {
		if (!isProjectionEnabled() || !isCustomId(courseId)) return;
		const startedAt = Date.now();
		const course = await this.getCourseById(courseId);
		if (!course || course.kind !== "custom") {
			await this.deleteSubjectView(courseId);
			this.logCost("rebuildCustomCourseSubjectView", 1, 1, Date.now() - startedAt, {
				courseId,
				action: "deleted_view",
			});
			return;
		}

		const topics = await this.listTopicsForCourse(courseId);
		const materialsMap = await this.listMaterialsForCourse(
			courseId,
			topics.map((topic) => topic.id)
		);
		const subject = mapCustomCourseToSubject({
			id: course.id,
			courseCode: course.courseCode,
			title: course.title,
			year: course.year,
			semester: course.semester,
			topics: topics
				.filter((topic) => topic.kind === "custom")
				.map((topic) => ({ id: topic.id, title: topic.title })),
		});
		const mergedTopics = mergeCustomItemsIntoTopics(subject.topics, materialsMap);
		await this.upsertSubjectView(courseId, {
			...subject,
			topics: mergedTopics,
		});
		this.logCost("rebuildCustomCourseSubjectView", 0, 1, Date.now() - startedAt, {
			courseId,
			topicCount: topics.length,
		});
	}

	async rebuildSubjectCatalogProjection(): Promise<void> {
		if (!isProjectionEnabled()) return;
		const startedAt = Date.now();
		const customCourses = await this.listCustomCourses();
		await this.getSubjectCatalogRef().set({
			courses: summarizeCustomCourses(customCourses),
			updatedAt: FieldValue.serverTimestamp(),
		});
		this.logCost(
			"rebuildSubjectCatalogProjection",
			customCourses.length,
			1,
			Date.now() - startedAt
		);
	}
}

export const contentRepository = new ContentRepository();
