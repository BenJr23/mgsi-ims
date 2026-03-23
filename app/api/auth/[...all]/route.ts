import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

const handler = toNextJsHandler(auth);
const internalAuthHeader = "x-internal-auth-check";
const protectedEndpointSuffix = "/api/auth/get-session";

export async function GET(request: Request) {
	const { pathname } = new URL(request.url);

	if (pathname.endsWith(protectedEndpointSuffix)) {
		const expectedSecret = process.env.BETTER_AUTH_SECRET;
		const providedSecret = request.headers.get(internalAuthHeader);

		if (!expectedSecret || providedSecret !== expectedSecret) {
			return new Response("Not Found", { status: 404 });
		}
	}

	return handler.GET(request);
}

export const POST = handler.POST;
