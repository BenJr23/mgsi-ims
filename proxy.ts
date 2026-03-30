import { NextRequest, NextResponse } from "next/server";

const authRoutes = ["/sign-in", "/sign-up"];
const internalAuthHeader = "x-internal-auth-check";

async function hasActiveSession(request: NextRequest) {
	const cookie = request.headers.get("cookie") ?? "";

	if (!cookie) {
		return false;
	}

	try {
		const sessionRes = await fetch(new URL("/api/auth/get-session", request.url), {
			headers: {
				cookie,
				[internalAuthHeader]: process.env.BETTER_AUTH_SECRET ?? "",
			},
			cache: "no-store",
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
	const isPublicItemRoute = /^\/\d+$/.test(pathname);
	const isStaticAsset = pathname.startsWith('/logo') || pathname.startsWith('/_next/');
	const loggedIn = await hasActiveSession(request);

	if (!loggedIn && !isAuthRoute && !isPublicItemRoute && !isStaticAsset) {
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

