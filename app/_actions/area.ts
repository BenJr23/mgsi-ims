"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

type CreateAreaResult =
	| {
			ok: true;
			areaId: string;
			message: string;
		}
	| {
			ok: false;
			message: string;
		};

const BRANCHES_CACHE_KEY = "branches:all:v2";

type RedisCommandResponse<T> = {
	result: T;
	error?: string;
};

async function runRedisCommand<T>(
	redisUrl: string,
	redisToken: string,
	command: unknown[],
): Promise<RedisCommandResponse<T>> {
	const response = await fetch(redisUrl, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${redisToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(command),
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(`Redis command failed with status ${response.status}`);
	}

	const payload = (await response.json()) as RedisCommandResponse<T>;
	if (payload.error) {
		throw new Error(`Redis command error: ${payload.error}`);
	}

	return payload;
}

async function invalidateBranchesCache(): Promise<void> {
	const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
	const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
	if (!redisUrl || !redisToken) {
		console.warn("[Area Action] Redis not configured, skipping cache invalidation");
		return;
	}

	try {
		await runRedisCommand<number>(redisUrl, redisToken, ["DEL", BRANCHES_CACHE_KEY]);
		console.log("[Area Action] Cache invalidated", {
			key: BRANCHES_CACHE_KEY,
		});
	} catch (error) {
		console.warn("[Area Action] Cache invalidation failed", {
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

export async function createAreaAction(input: {
	externalBranchId: string;
	roomName: string;
	roomCode: string | null;
}): Promise<CreateAreaResult> {
	const traceId = `area_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

	try {
		// Get current user session
		console.log("[Area Action] Attempting to get user session", { traceId });
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		console.log("[Area Action] Session response", {
			traceId,
			hasSession: Boolean(session),
			hasUser: Boolean(session?.user),
			userId: session?.user?.id,
		});

		if (!session || !session.user) {
			console.warn("[Area Action] Unauthorized access attempt", { traceId });
			return {
				ok: false,
				message: "You must be logged in to create an area.",
			};
		}

		const userId = session.user.id;

		// Validate input
		if (!input.externalBranchId || !input.roomName.trim()) {
			console.warn("[Area Action] Invalid input", {
				traceId,
				externalBranchId: input.externalBranchId,
				roomName: input.roomName,
			});
			return {
				ok: false,
				message: "External branch ID and room name are required.",
			};
		}

		// Normalize roomCode: convert empty string to null
		const normalizedRoomCode = input.roomCode
			? input.roomCode.trim() || null
			: null;

		console.log("[Area Action] Creating area with normalized data", {
			traceId,
			externalBranchId: input.externalBranchId,
			roomName: input.roomName.trim(),
			roomCode: normalizedRoomCode,
			createdById: userId,
		});

		// Create the area in the database
		const area = await prisma.area.create({
			data: {
				roomName: input.roomName.trim(),
				roomCode: normalizedRoomCode,
				externalBranchId: input.externalBranchId,
				createdById: userId,
			},
			select: {
				id: true,
				roomName: true,
				roomCode: true,
			},
		});

		console.log("[Area Action] Area created successfully", {
			traceId,
			areaId: area.id,
			roomName: area.roomName,
			roomCode: area.roomCode,
		});

		// Invalidate cache so next refetch gets fresh data including this new area
		await invalidateBranchesCache();

		return {
			ok: true,
			areaId: area.id,
			message: "Area created successfully.",
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		const errorStack = error instanceof Error ? error.stack : "";

		console.error("[Area Action] Create failed", {
			traceId,
			error: errorMessage,
			stack: errorStack,
		});

		// Check if it's a unique constraint violation (duplicate roomCode per branch)
		if (errorMessage.includes("Unique constraint failed")) {
			return {
				ok: false,
				message:
					"An area with this room code already exists in this branch.",
			};
		}

		// Check for other known error patterns
		if (errorMessage.includes("Foreign key constraint failed")) {
			return {
				ok: false,
				message: "Invalid branch reference. Please refresh and try again.",
			};
		}

		return {
			ok: false,
			message: `Unable to create area: ${errorMessage}`,
		};
	}
}
