import { headers } from "next/headers";
// import { cache } from "react";
import { auth } from "./auth";
import { prisma } from "./prisma";

// const getSessionCached = cache(async () => {
//     return await auth.api.getSession({ headers: await headers() });
// });

export async function getSession() {
    return await auth.api.getSession({ headers: await headers() });
}

// export async function getSession() {
//     return await getSessionCached();
// }

/**
 * Get the current logged-in user (SERVER-SIDE ONLY)
 * Use this in server components, server actions, and API routes
 * Returns null if no user is logged in
 */
export async function getCurrentUser() {
    const session = await getSession();
    return session?.user ?? null;
}

/**
 * Get the current user with company data (SERVER-SIDE ONLY)
 * Returns null if no user is logged in
 */
export async function getCurrentUserWithCompany() {
    const session = await getSession();
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phoneNumber: true,
        },
    });

    if (!user) return null;

    return {
        ...user,
        companyId: null,
    };
}

/**
 * Require authentication - throws if no user is logged in (SERVER-SIDE ONLY)
 * Use this in server actions or API routes that require authentication
 */
export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Unauthorized - please sign in");
    }
    return user;
}