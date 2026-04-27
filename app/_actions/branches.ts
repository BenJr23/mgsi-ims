"use server";

import { prisma } from "@/lib/prisma";

export type BranchArea = {
	id: string;
	name: string;
	code: string | null;
	equipCount: number | null;
	source: 'local' | 'api';
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

const BRANCHES_API_URL = "https://mgsi-bms-superadmin.vercel.app/api/branches";
const BRANCHES_CACHE_KEY = "branches:all:v2";
const BRANCHES_CACHE_TTL_SECONDS = 300;
const EQUIPMENT_CACHE_KEY = "equipment:all:v1";
const EQUIPMENT_MODELS_CACHE_KEY = "equipment-models:all:v1";
const EQUIPMENT_CACHE_TTL_SECONDS = 300;
const EQUIPMENT_MODELS_CACHE_TTL_SECONDS = 300;

type RedisCommandResponse<T> = {
	result: T;
	error?: string;
};

type EquipmentModelCacheItem = {
	id: string;
	name: string;
	description: string;
	type: string;
	price: string | null;
	createdBy: string;
	createdAt: string;
	unitCount: number;
};

type EquipmentCacheItem = {
	id: string;
	qrCode: string;
	sku: string | null;
	modelName: string;
	modelType: string;
	status: "AVAILABLE" | "MAINTENANCE" | "RETIRED" | "LOST";
	areaName: string;
	branchName: string;
	createdBy: string;
	createdAt: string;
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

function formatDisplayDate(date: Date): string {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric",
	}).format(date);
}

async function getEquipmentCountByAreaId(): Promise<Map<string, number>> {
	const equipmentCounts = await prisma.equipment.groupBy({
		by: ["areaId"],
		where: {
			deletedAt: null,
		},
		_count: {
			_all: true,
		},
	});

	return new Map(equipmentCounts.map((row) => [row.areaId, row._count._all]));
}

function applyLiveEquipmentCountsToBranches(
	branches: BranchItem[],
	equipmentCountByAreaId: Map<string, number>,
): BranchItem[] {
	return branches.map((branch) => {
		const areas = (branch.areas ?? []).map((area) => ({
			...area,
			equipCount: equipmentCountByAreaId.get(area.id) ?? 0,
		}));

		const totalEquipmentCount = areas.reduce((sum, area) => sum + (area.equipCount ?? 0), 0);

		return {
			...branch,
			areaCount: areas.length,
			equipCount: totalEquipmentCount,
			areas,
		};
	});
}

async function warmEquipmentModelsCacheIfMissing(
	redisUrl: string,
	redisToken: string,
	traceId: string,
): Promise<void> {
	const existingModelsCache = await runRedisCommand<string | null>(redisUrl, redisToken, [
		"GET",
		EQUIPMENT_MODELS_CACHE_KEY,
	]);

	if (existingModelsCache.result) {
		console.log("[Branches Action] Dependent cache already present", {
			traceId,
			key: EQUIPMENT_MODELS_CACHE_KEY,
		});
		return;
	}

	const models = await prisma.equipmentModel.findMany({
		where: {
			deletedAt: null,
		},
		select: {
			id: true,
			name: true,
			description: true,
			type: true,
			price: true,
			createdAt: true,
			createdBy: {
				select: {
					name: true,
				},
			},
			equipment: {
				where: {
					deletedAt: null,
				},
				select: {
					id: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	const formattedModels: EquipmentModelCacheItem[] = models.map((model) => ({
		id: model.id,
		name: model.name,
		description: model.description ?? "",
		type: model.type,
		price: model.price ? model.price.toString() : null,
		createdBy: model.createdBy.name,
		createdAt: formatDisplayDate(model.createdAt),
		unitCount: model.equipment.length,
	}));

	await runRedisCommand<string>(redisUrl, redisToken, [
		"SET",
		EQUIPMENT_MODELS_CACHE_KEY,
		JSON.stringify(formattedModels),
		"EX",
		EQUIPMENT_MODELS_CACHE_TTL_SECONDS,
	]);

	console.log("[Branches Action] Dependent cache warmed", {
		traceId,
		key: EQUIPMENT_MODELS_CACHE_KEY,
		count: formattedModels.length,
		ttlSeconds: EQUIPMENT_MODELS_CACHE_TTL_SECONDS,
	});
}

async function warmEquipmentCacheIfMissing(
	redisUrl: string,
	redisToken: string,
	traceId: string,
	branches: BranchItem[],
): Promise<void> {
	const existingEquipmentCache = await runRedisCommand<string | null>(redisUrl, redisToken, [
		"GET",
		EQUIPMENT_CACHE_KEY,
	]);

	if (existingEquipmentCache.result) {
		console.log("[Branches Action] Dependent cache already present", {
			traceId,
			key: EQUIPMENT_CACHE_KEY,
		});
		return;
	}

	const areaLookup = new Map(
		branches.flatMap((branch) =>
			(branch.areas ?? []).map((area) => [area.id, { areaName: area.name, branchName: branch.name }]),
		),
	);

	const equipment = await prisma.equipment.findMany({
		where: {
			deletedAt: null,
		},
		select: {
			id: true,
			qrCode: true,
			sku: true,
			status: true,
			createdAt: true,
			equipmentModel: {
				select: {
					name: true,
					type: true,
				},
			},
			areaId: true,
			createdBy: {
				select: {
					name: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	const formattedEquipment: EquipmentCacheItem[] = equipment.map((item) => ({
		id: item.id,
		qrCode: item.qrCode,
		sku: item.sku,
		modelName: item.equipmentModel.name,
		modelType: item.equipmentModel.type,
		status: item.status,
		areaName: areaLookup.get(item.areaId)?.areaName ?? item.areaId,
		branchName: areaLookup.get(item.areaId)?.branchName ?? "Unknown branch",
		createdBy: item.createdBy.name,
		createdAt: formatDisplayDate(item.createdAt),
	}));

	await runRedisCommand<string>(redisUrl, redisToken, [
		"SET",
		EQUIPMENT_CACHE_KEY,
		JSON.stringify(formattedEquipment),
		"EX",
		EQUIPMENT_CACHE_TTL_SECONDS,
	]);

	console.log("[Branches Action] Dependent cache warmed", {
		traceId,
		key: EQUIPMENT_CACHE_KEY,
		count: formattedEquipment.length,
		ttlSeconds: EQUIPMENT_CACHE_TTL_SECONDS,
	});
}

async function warmDependentCachesFromBranches(
	redisUrl: string,
	redisToken: string,
	traceId: string,
	branches: BranchItem[],
): Promise<void> {
	try {
		await Promise.all([
			warmEquipmentModelsCacheIfMissing(redisUrl, redisToken, traceId),
			warmEquipmentCacheIfMissing(redisUrl, redisToken, traceId, branches),
		]);
	} catch (error) {
		console.warn("[Branches Action] Dependent cache warmup failed", {
			traceId,
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
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
					const equipmentCountByAreaId = await getEquipmentCountByAreaId();
					const branchesWithLiveCounts = applyLiveEquipmentCountsToBranches(
						cachedBranches,
						equipmentCountByAreaId,
					);

					await warmDependentCachesFromBranches(
						redisUrl,
						redisToken,
						traceId,
						branchesWithLiveCounts,
					);

					console.log("[Branches Action] Cache hit", {
						traceId,
						key: BRANCHES_CACHE_KEY,
						count: branchesWithLiveCounts.length,
					});

					return {
						ok: true,
						branches: branchesWithLiveCounts,
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
		
		// Fetch local areas from database
		const localAreas = await prisma.area.findMany({
			where: {
				deletedAt: null,
			},
			select: {
				id: true,
				roomName: true,
				roomCode: true,
				externalBranchId: true,
			},
		});

		const equipmentCountByAreaId = await getEquipmentCountByAreaId();

		console.log("[Branches Action] Fetched local areas from database", {
			traceId,
			count: localAreas.length,
		});

		// Create a map of local areas by externalBranchId for fast lookup
		const localAreasByBranch = new Map<string, typeof localAreas>();
		localAreas.forEach((area) => {
			if (!localAreasByBranch.has(area.externalBranchId)) {
				localAreasByBranch.set(area.externalBranchId, []);
			}
			localAreasByBranch.get(area.externalBranchId)!.push(area);
		});

		const branches = rawBranches.map((branch) => {
			// Get API areas (rooms)
			const apiAreas = branch.rooms.map((room) => ({
				id: room.id,
				name: room.roomName,
				code: room.roomCode,
				equipCount: equipmentCountByAreaId.get(room.id) ?? 0,
				source: 'api' as const,
			}));

			// Get local areas for this branch
			const branchLocalAreas = localAreasByBranch.get(branch.id) ?? [];
			const localAreasFormatted = branchLocalAreas.map((area) => ({
				id: area.id,
				name: area.roomName,
				code: area.roomCode,
				equipCount: equipmentCountByAreaId.get(area.id) ?? 0,
				source: 'local' as const,
			}));

			// Merge: local areas first (newly created), then API areas
			const allAreas = [...localAreasFormatted, ...apiAreas];
			const totalEquipmentCount = allAreas.reduce(
				(sum, area) => sum + (area.equipCount ?? 0),
				0,
			);

			return {
				id: branch.id,
				name: branch.buildingName,
				code: branch.buildingCode,
				address: branch.address,
				areaCount: allAreas.length,
				equipCount: totalEquipmentCount,
				areas: allAreas,
			};
		});
		
		console.log("[Branches Action] Normalized branches with local areas merged", {
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

			await warmDependentCachesFromBranches(redisUrl, redisToken, traceId, branches);
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
