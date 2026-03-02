import {
	deleteAdminTopicByIdHandler,
} from "@/lib/server/domains/content/handlers/topicById";

export const runtime = "nodejs";

export const DELETE = deleteAdminTopicByIdHandler;
