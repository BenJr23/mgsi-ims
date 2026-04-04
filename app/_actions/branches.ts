"use server";

export type BranchArea = {
	id: string;
	name: string;
	code: string | null;
	equipCount: number | null;
};

export type BranchItem = {
	id: string;
	name: string;
	code: string;
	address: string | null;
	areaCount?: number;
	equipCount?: number | null;
	areas?: BranchArea[];
};

type ExternalRoom = {
	id: string;
	roomName: string;
	roomCode: string | null;
	capacity: number;
	status: string;
	buildingId: string;
};

type ExternalBranch = {
	id: string;
	buildingName: string;
	buildingCode: string;
	address: string | null;
	status: string;
	rooms: ExternalRoom[];
};

type BranchesApiResponse = {
	success?: boolean;
	data?: {
		branches?: ExternalBranch[];
		rooms?: ExternalRoom[];
	};
	branches?: ExternalBranch[];
	rooms?: ExternalRoom[];
	error?: string;
};

type FetchBranchesResult =
	| {
			ok: true;
			branches: BranchItem[];
		}
	| {
			ok: false;
			message: string;
		};

const BRANCHES_API_URL = "http://localhost:3001/api/branches";
const BRANCHES_CACHE_KEY = "branches:all:v1";
const BRANCHES_CACHE_TTL_SECONDS = 300;

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

export async function fetchBranchesAction(): Promise<FetchBranchesResult> {
	const secretKey = process.env.BMS_SECRET_KEY?.trim();
		const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
		const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
	const traceId = `branches_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

	if (!secretKey) {
		console.warn("[Branches Action] Missing BMS_SECRET_KEY", { traceId });
		return {
			ok: false,
			message: "BMS_SECRET_KEY is not configured.",
		};
	}

	if ((redisUrl && !redisToken) || (!redisUrl && redisToken)) {
		console.warn("[Branches Action] Partial Redis configuration detected", {
			traceId,
			hasRedisUrl: Boolean(redisUrl),
			hasRedisToken: Boolean(redisToken),
		});
	}

	try {
		if (redisUrl && redisToken) {
			try {
				const cacheResponse = await runRedisCommand<string | null>(redisUrl, redisToken, [
					"GET",
					BRANCHES_CACHE_KEY,
				]);

				if (cacheResponse.result) {
					const cachedBranches = JSON.parse(cacheResponse.result) as BranchItem[];
					console.log("[Branches Action] Cache hit", {
						traceId,
						key: BRANCHES_CACHE_KEY,
						count: cachedBranches.length,
					});

					return {
						ok: true,
						branches: cachedBranches,
					};
				}

				console.log("[Branches Action] Cache miss", {
					traceId,
					key: BRANCHES_CACHE_KEY,
				});
			} catch (cacheReadError) {
				console.warn("[Branches Action] Cache read failed", {
					traceId,
					error:
						cacheReadError instanceof Error ? cacheReadError.message : "Unknown cache read error",
				});
			}
		}

		console.log("[Branches Action] Fetching branches", {
			traceId,
			url: BRANCHES_API_URL,
		});

		const response = await fetch(BRANCHES_API_URL, {
			method: "GET",
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${secretKey}`,
				"Content-Type": "application/json",
				"x-bms-secret-key": secretKey,
			},
			cache: "no-store",
		});

		console.log("[Branches Action] Response received", {
			traceId,
			ok: response.ok,
			status: response.status,
			statusText: response.statusText,
		});

		if (!response.ok) {
			console.warn("[Branches Action] Non-OK response", { traceId, status: response.status });
			return {
				ok: false,
				message: `Unable to fetch branches. Received ${response.status}.`,
			};
		}

		const payload = (await response.json()) as BranchesApiResponse;
		console.log("[Branches Action] Parsed payload", { traceId, payload });

		const rawBranches = payload.data?.branches ?? payload.branches ?? [];
		const branches = rawBranches.map((branch) => ({
			id: branch.id,
			name: branch.buildingName,
			code: branch.buildingCode,
			address: branch.address,
			areaCount: branch.rooms.length,
			equipCount: branch.rooms.reduce((sum, room) => sum + (room.capacity ?? 0), 0),
			areas: branch.rooms.map((room) => ({
				id: room.id,
				name: room.roomName,
				code: room.roomCode,
				equipCount: room.capacity,
			})),
		}));
		console.log("[Branches Action] Normalized branches", {
			traceId,
			count: branches.length,
		});

		if (redisUrl && redisToken) {
			try {
				await runRedisCommand<string>(redisUrl, redisToken, [
					"SET",
					BRANCHES_CACHE_KEY,
					JSON.stringify(branches),
					"EX",
					BRANCHES_CACHE_TTL_SECONDS,
				]);

				console.log("[Branches Action] Cache updated", {
					traceId,
					key: BRANCHES_CACHE_KEY,
					ttlSeconds: BRANCHES_CACHE_TTL_SECONDS,
				});
			} catch (cacheWriteError) {
				console.warn("[Branches Action] Cache write failed", {
					traceId,
					error:
						cacheWriteError instanceof Error ? cacheWriteError.message : "Unknown cache write error",
				});
			}
		}

		return {
			ok: true,
			branches,
		};
	} catch {
		console.error("[Branches Action] Fetch failed", { traceId });
		return {
			ok: false,
			message: "Unable to fetch branches right now.",
		};
	}
}
