import {
	deleteAdminInteractiveAssetHandler,
	postAdminInteractiveAssetHandler,
} from "@/lib/server/domains/content/handlers/interactiveAssets";

export const runtime = "nodejs";

export const POST = postAdminInteractiveAssetHandler;
export const DELETE = deleteAdminInteractiveAssetHandler;
