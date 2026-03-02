import {
	deleteAdminMaterialByIdHandler,
	putAdminMaterialByIdHandler,
} from "@/lib/server/domains/content/handlers/materialById";

export const runtime = "nodejs";

export const PUT = putAdminMaterialByIdHandler;
export const DELETE = deleteAdminMaterialByIdHandler;
