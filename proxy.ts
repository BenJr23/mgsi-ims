import { NextRequest, NextResponse } from "next/server";

const authRoutes = ["/sign-in", "/sign-up"];

function hasSessionCookie(request: NextRequest) {
	const cookie = request.headers.get("cookie") ?? "";

	if (!cookie) {
		return false;
	}

	return /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=/.test(cookie);
}

export async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
	const isPublicItemRoute = /^\/\d+$/.test(pathname);
	const isStaticAsset = pathname.startsWith('/logo') || pathname.startsWith('/_next/');
	const hasSession = hasSessionCookie(request);

	if (!hasSession && !isAuthRoute && !isPublicItemRoute && !isStaticAsset) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set("next", pathname);
		return NextResponse.redirect(signInUrl);
	}

	if (hasSession && isAuthRoute) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

