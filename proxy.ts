import { NextRequest, NextResponse } from "next/server";

const authRoutes = ["/sign-in", "/sign-up"];

async function hasActiveSession(request: NextRequest) {
	const cookie = request.headers.get("cookie") ?? "";

	if (!cookie) {
		return false;
	}

	try {
		const sessionRes = await fetch(new URL("/api/auth/get-session", request.url), {
			headers: {
				cookie,
			},
		});

		if (!sessionRes.ok) {
			return false;
		}

		const data = (await sessionRes.json()) as { user?: unknown } | null;
		return Boolean(data?.user);
	} catch {
		return false;
	}
}

export async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
	const loggedIn = await hasActiveSession(request);

	if (!loggedIn && !isAuthRoute) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set("next", pathname);
		return NextResponse.redirect(signInUrl);
	}

	if (loggedIn && isAuthRoute) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

