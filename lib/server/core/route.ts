import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/server/core/errors";

type AsyncRouteHandler<TArgs extends unknown[]> = (
	...args: TArgs
) => Promise<NextResponse>;

export function withErrorHandling<TArgs extends unknown[]>(
	handler: AsyncRouteHandler<TArgs>
): AsyncRouteHandler<TArgs> {
	return async (...args: TArgs): Promise<NextResponse> => {
		try {
			return await handler(...args);
		} catch (error) {
			return toErrorResponse(error);
		}
	};
}
