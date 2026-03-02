import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function loadEnvLocal() {
	const envPath = path.join(projectRoot, ".env.local");
	if (!fs.existsSync(envPath)) return;

	const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eqIndex = trimmed.indexOf("=");
		if (eqIndex === -1) continue;
		const key = trimmed.slice(0, eqIndex).trim();
		let value = trimmed.slice(eqIndex + 1).trim();
		if (value.endsWith(",")) {
			value = value.slice(0, -1).trim();
		}
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (!(key in process.env)) {
			process.env[key] = value;
		}
	}
}

function idString(value) {
	if (value == null) return "";
	if (typeof value === "string") return value;
	if (typeof value === "number") return String(value);
	if (typeof value === "object" && typeof value.toHexString === "function") {
		return value.toHexString();
	}
	return String(value);
}

function toDate(value) {
	if (!value) return new Date();
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? new Date() : date;
}

function ensureFirebaseApp() {
	if (getApps().length > 0) return;

	const projectId = process.env.FIREBASE_PROJECT_ID;
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
	const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
	const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, "\n") : undefined;

	if (!projectId || !clientEmail || !privateKey) {
		throw new Error(
			"Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY."
		);
	}

	initializeApp({
		credential: cert({ projectId, clientEmail, privateKey }),
		projectId,
	});
}

async function commitSetOperations(db, operations) {
	let batch = db.batch();
	let count = 0;

	for (const op of operations) {
		batch.set(op.ref, op.data, { merge: op.merge === true });
		count += 1;

		if (count >= 400) {
			await batch.commit();
			batch = db.batch();
			count = 0;
		}
	}

	if (count > 0) {
		await batch.commit();
	}
}

function parseDbNameFromMongoUri(uri) {
	try {
		const parsed = new URL(uri);
		const pathname = parsed.pathname || "";
		const dbName = pathname.replace(/^\//, "").trim();
		return dbName || null;
	} catch {
		return null;
	}
}

async function getCollectionCountSafe(db, collectionName) {
	try {
		return await db.collection(collectionName).estimatedDocumentCount();
	} catch {
		return 0;
	}
}

async function resolveCollectionName(db, aliases) {
	const collections = await db.listCollections({}, { nameOnly: true }).toArray();
	const nameSet = new Set(collections.map((c) => c.name));

	for (const alias of aliases) {
		if (nameSet.has(alias)) {
			return alias;
		}
	}

	// Case-insensitive fallback
	for (const alias of aliases) {
		const found = collections.find((c) => c.name.toLowerCase() === alias.toLowerCase());
		if (found) return found.name;
	}

	return null;
}

async function findBestMongoSource(mongoClient, dbCandidates, collectionAliasesByKey) {
	let best = null;

	for (const dbName of dbCandidates) {
		if (!dbName) continue;
		const db = mongoClient.db(dbName);

		const resolvedCollections = {};
		let total = 0;

		for (const [key, aliases] of Object.entries(collectionAliasesByKey)) {
			const collectionName = await resolveCollectionName(db, aliases);
			resolvedCollections[key] = collectionName;
			if (collectionName) {
				total += await getCollectionCountSafe(db, collectionName);
			}
		}

		if (!best || total > best.total) {
			best = {
				dbName,
				total,
				resolvedCollections,
			};
		}
	}

	return best;
}

async function main() {
	loadEnvLocal();

	const mongoUri = process.env.MONGODB_URI;
	const envMongoDbName = process.env.MONGODB_DB_NAME;
	const uriMongoDbName = mongoUri ? parseDbNameFromMongoUri(mongoUri) : null;

	if (!mongoUri) {
		throw new Error("Missing MONGODB_URI");
	}

	ensureFirebaseApp();
	const firestore = getFirestore();

	const mongoClient = new MongoClient(mongoUri);
	await mongoClient.connect();

	try {
		const dbCandidates = [];
		if (envMongoDbName) {
			dbCandidates.push(envMongoDbName, envMongoDbName.toLowerCase(), envMongoDbName.toUpperCase());
		}
		if (uriMongoDbName) {
			dbCandidates.push(uriMongoDbName, uriMongoDbName.toLowerCase(), uriMongoDbName.toUpperCase());
		}

		// Include all visible DBs as fallback.
		try {
			const allDbs = await mongoClient.db().admin().listDatabases();
			for (const dbInfo of allDbs.databases || []) {
				dbCandidates.push(dbInfo.name);
			}
		} catch {
			// Ignore if permissions do not allow listing DBs.
		}

		const uniqueDbCandidates = Array.from(new Set(dbCandidates.filter(Boolean)));

		const collectionAliasesByKey = {
			courses: ["customcourses", "CustomCourse", "custom_course", "custom_courses"],
			topics: ["customtopics", "CustomTopic", "custom_topic", "custom_topics"],
			materials: ["custommaterials", "CustomMaterial", "custom_material", "custom_materials"],
			interactiveContents: [
				"interactivecontents",
				"InteractiveContent",
				"interactive_content",
				"interactive_contents",
			],
		};

		const source = await findBestMongoSource(
			mongoClient,
			uniqueDbCandidates,
			collectionAliasesByKey
		);

		if (!source) {
			throw new Error("Could not resolve any MongoDB source database.");
		}

		console.log(`Using MongoDB database: ${source.dbName}`);
		console.log("Resolved collections:", source.resolvedCollections);
		if (source.total === 0) {
			throw new Error(
				[
					"No source documents found in resolved Mongo collections.",
					`Checked DB candidates: ${uniqueDbCandidates.join(", ") || "(none)"}`,
					"Set MONGODB_DB_NAME explicitly to the database that contains your data.",
				].join(" ")
			);
		}

		const mongoDb = mongoClient.db(source.dbName);
		const coursesCollection = source.resolvedCollections.courses;
		const topicsCollection = source.resolvedCollections.topics;
		const materialsCollection = source.resolvedCollections.materials;
		const interactiveCollection = source.resolvedCollections.interactiveContents;

		const [courses, topics, materials, interactiveContents] = await Promise.all([
			coursesCollection ? mongoDb.collection(coursesCollection).find({}).toArray() : Promise.resolve([]),
			topicsCollection ? mongoDb.collection(topicsCollection).find({}).toArray() : Promise.resolve([]),
			materialsCollection
				? mongoDb.collection(materialsCollection).find({}).toArray()
				: Promise.resolve([]),
			interactiveCollection
				? mongoDb.collection(interactiveCollection).find({}).toArray()
				: Promise.resolve([]),
		]);

		const backupDir = path.join(projectRoot, "migration-backups");
		fs.mkdirSync(backupDir, { recursive: true });
		const backupPath = path.join(
			backupDir,
			`mongo-export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
		);

		fs.writeFileSync(
			backupPath,
			JSON.stringify({ courses, topics, materials, interactiveContents }, null, 2),
			"utf8"
		);

		console.log(`Backup written: ${backupPath}`);

		const courseDocs = new Map();
		const topicDocsByCourse = new Map();

		for (const course of courses) {
			const courseId = idString(course._id);
			courseDocs.set(courseId, {
				kind: "custom",
				courseCode: course.courseCode || courseId,
				title: course.title || "",
				year: Number(course.year) || 0,
				semester: Number(course.semester) || 0,
				createdAt: toDate(course.createdAt),
				updatedAt: toDate(course.updatedAt),
			});

			if (!topicDocsByCourse.has(courseId)) {
				topicDocsByCourse.set(courseId, new Map());
			}
			const topicMap = topicDocsByCourse.get(courseId);

			const embeddedTopics = Array.isArray(course.topics) ? course.topics : [];
			for (const embeddedTopic of embeddedTopics) {
				const topicId = idString(embeddedTopic._id);
				if (!topicId) continue;
				topicMap.set(topicId, {
					title: embeddedTopic.title || "Untitled Topic",
					kind: "custom",
					createdAt: toDate(embeddedTopic.createdAt || course.createdAt),
					updatedAt: toDate(embeddedTopic.updatedAt || course.updatedAt),
				});
			}
		}

		for (const topic of topics) {
			const courseId = idString(topic.courseId);
			const topicId = idString(topic._id);
			if (!courseId || !topicId) continue;

			if (!courseDocs.has(courseId)) {
				courseDocs.set(courseId, {
					kind: "overlay",
					courseCode: courseId,
					title: "Canvas Overlay",
					year: 0,
					semester: 0,
					createdAt: toDate(topic.createdAt),
					updatedAt: toDate(topic.updatedAt),
				});
			}

			if (!topicDocsByCourse.has(courseId)) {
				topicDocsByCourse.set(courseId, new Map());
			}

			topicDocsByCourse.get(courseId).set(topicId, {
				title: topic.title || "Untitled Topic",
				kind: "custom",
				createdAt: toDate(topic.createdAt),
				updatedAt: toDate(topic.updatedAt),
			});
		}

		for (const material of materials) {
			const courseId = idString(material.courseId);
			const topicId = idString(material.topicId);
			if (!courseId || !topicId) continue;

			if (!courseDocs.has(courseId)) {
				courseDocs.set(courseId, {
					kind: "overlay",
					courseCode: courseId,
					title: "Canvas Overlay",
					year: 0,
					semester: 0,
					createdAt: toDate(material.createdAt),
					updatedAt: toDate(material.updatedAt),
				});
			}

			if (!topicDocsByCourse.has(courseId)) {
				topicDocsByCourse.set(courseId, new Map());
			}

			const topicMap = topicDocsByCourse.get(courseId);
			if (!topicMap.has(topicId)) {
				topicMap.set(topicId, {
					title: "Canvas Overlay Topic",
					kind: "overlay",
					createdAt: toDate(material.createdAt),
					updatedAt: toDate(material.updatedAt),
				});
			}
		}

		const setOperations = [];

		for (const [courseId, courseDoc] of courseDocs) {
			setOperations.push({
				ref: firestore.collection("courses").doc(courseId),
				data: courseDoc,
				merge: true,
			});
		}

		for (const [courseId, topicMap] of topicDocsByCourse) {
			for (const [topicId, topicDoc] of topicMap) {
				setOperations.push({
					ref: firestore
						.collection("courses")
						.doc(courseId)
						.collection("topics")
						.doc(topicId),
					data: topicDoc,
					merge: true,
				});
			}
		}

		for (const material of materials) {
			const courseId = idString(material.courseId);
			const topicId = idString(material.topicId);
			const itemId = idString(material._id);
			if (!courseId || !topicId || !itemId) continue;

			setOperations.push({
				ref: firestore
					.collection("courses")
					.doc(courseId)
					.collection("topics")
					.doc(topicId)
					.collection("items")
					.doc(itemId),
				data: {
					item: material.item || {},
					createdAt: toDate(material.createdAt),
					updatedAt: toDate(material.updatedAt),
				},
				merge: true,
			});
		}

		for (const interactive of interactiveContents) {
			const interactiveId = idString(interactive._id);
			const courseId = idString(interactive.courseId);
			if (!interactiveId || !courseId) continue;

			setOperations.push({
				ref: firestore.collection("interactive_contents").doc(interactiveId),
				data: {
					courseId,
					title: interactive.title || "",
					contentType: interactive.contentType === "Flashcard" ? "Flashcard" : "Quiz",
					content: interactive.content || {},
					createdAt: toDate(interactive.createdAt),
					updatedAt: toDate(interactive.updatedAt),
				},
				merge: true,
			});
		}

		await commitSetOperations(firestore, setOperations);

		console.log("Migration completed.");
		console.log(`Courses migrated: ${courseDocs.size}`);
		console.log(
			`Topics migrated: ${Array.from(topicDocsByCourse.values()).reduce(
				(total, topicMap) => total + topicMap.size,
				0
			)}`
		);
		console.log(`Materials migrated: ${materials.length}`);
		console.log(`Interactive contents migrated: ${interactiveContents.length}`);
	} finally {
		await mongoClient.close();
	}
}

main().catch((error) => {
	console.error("Migration failed:", error);
	process.exit(1);
});
