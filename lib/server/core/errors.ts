import { NextResponse } from "next/server";

export class HttpError extends Error {
	status: number;
	code: string;
	details?: unknown;

	constructor(status: number, message: string, code = "error", details?: unknown) {
		super(message);
		this.name = "HttpError";
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

export function toErrorResponse(error: unknown): NextResponse {
	if (error instanceof HttpError) {
		return NextResponse.json(
			{
				error: error.message,
				code: error.code,
				details: error.details,
			},
			{ status: error.status }
		);
	}

	console.error("Unhandled API error:", error);
	return NextResponse.json(
		{
			error: "Internal Server Error",
			code: "internal_error",
		},
		{ status: 500 }
	);
}
