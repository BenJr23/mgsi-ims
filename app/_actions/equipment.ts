"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { fetchBranchesAction } from "@/app/_actions/branches";
import { fetchEquipmentModelsAction } from "@/app/_actions/equipmentmodel";

type EquipmentStatus = "AVAILABLE" | "MAINTENANCE" | "RETIRED" | "LOST";

type CreateEquipmentResult =
	| {
			ok: true;
			equipmentId: string;
			message: string;
		}
	| {
			ok: false;
			message: string;
		};

export type EquipmentListItem = {
	id: string;
	qrCode: string;
	sku: string | null;
	modelName: string;
	modelType: string;
	status: EquipmentStatus;
	areaName: string;
	branchName: string;
	createdBy: string;
	createdAt: string;
};

type FetchEquipmentResult =
	| {
			ok: true;
			equipment: EquipmentListItem[];
		}
	| {
			ok: false;
			message: string;
		};

const EQUIPMENT_CACHE_KEY = "equipment:all:v1";
const BRANCHES_CACHE_KEY = "branches:all:v2";
const EQUIPMENT_MODELS_CACHE_KEY = "equipment-models:all:v1";
const EQUIPMENT_CACHE_TTL_SECONDS = 300;
const EQUIPMENT_ROUTE_PREFIX = "/equipment";

function getAppBaseUrl(): string {
	const configuredUrl =
		process.env.NEXT_PUBLIC_QR_BASE_URL?.trim() ||
		process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
		process.env.VERCEL_URL?.trim() ||
		"http://localhost:3000";

	if (/^https?:\/\//i.test(configuredUrl)) {
		return configuredUrl.replace(/\/$/, "");
	}

	return `https://${configuredUrl.replace(/\/$/, "")}`;
}

function generateEquipmentSku(): string {
	const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
	const timestamp = Date.now().toString(36).toUpperCase();
	return `EQ-${timestamp}-${randomSuffix}`;
}

function buildEquipmentQrCodeUrl(sku: string): string {
	return `${getAppBaseUrl()}${EQUIPMENT_ROUTE_PREFIX}/${encodeURIComponent(sku)}`;
}

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

async function invalidateEquipmentCaches(): Promise<void> {
	const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
	const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

	if (!redisUrl || !redisToken) {
		console.warn("[Equipment Action] Redis not configured, skipping cache invalidation");
		return;
	}

	const cacheKeys = [EQUIPMENT_CACHE_KEY, BRANCHES_CACHE_KEY, EQUIPMENT_MODELS_CACHE_KEY];

	for (const cacheKey of cacheKeys) {
		try {
			await runRedisCommand<number>(redisUrl, redisToken, ["DEL", cacheKey]);
			console.log("[Equipment Action] Cache invalidated", { key: cacheKey });
		} catch (error) {
			console.warn("[Equipment Action] Cache invalidation failed", {
				key: cacheKey,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}
}

export async function fetchEquipmentAction(): Promise<FetchEquipmentResult> {
	const traceId = `equipment_fetch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
	const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

	try {
		if (redisUrl && redisToken) {
			try {
				const cacheResponse = await runRedisCommand<string | null>(redisUrl, redisToken, [
					"GET",
					EQUIPMENT_CACHE_KEY,
				]);

				if (cacheResponse.result) {
					const cachedEquipment = JSON.parse(cacheResponse.result) as EquipmentListItem[];
					console.log("[Equipment Action] Cache hit", {
						traceId,
						key: EQUIPMENT_CACHE_KEY,
						count: cachedEquipment.length,
					});

					return {
						ok: true,
						equipment: cachedEquipment,
					};
				}

				console.log("[Equipment Action] Cache miss", {
					traceId,
					key: EQUIPMENT_CACHE_KEY,
				});
			} catch (cacheReadError) {
				console.warn("[Equipment Action] Cache read failed", {
					traceId,
					error:
						cacheReadError instanceof Error ? cacheReadError.message : "Unknown cache read error",
				});
			}
		}

		// Warm dependent caches so equipment, branches, and equipment models stay aligned.
		const [branchesResult, equipmentModelsResult] = await Promise.all([
			fetchBranchesAction(),
			fetchEquipmentModelsAction(),
		]);

		if (!branchesResult.ok) {
			return {
				ok: false,
				message: branchesResult.message,
			};
		}

		if (!equipmentModelsResult.ok) {
			console.warn("[Equipment Action] Equipment model cache warmup failed", {
				traceId,
				message: equipmentModelsResult.message,
			});
		}

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

		const areaLookup = new Map(
			branchesResult.branches.flatMap((branch) =>
				(branch.areas ?? []).map((area) => [area.id, { areaName: area.name, branchName: branch.name }]),
			),
		);

		const formattedEquipment: EquipmentListItem[] = equipment.map((item) => ({
			id: item.id,
			qrCode: item.qrCode,
			sku: item.sku,
			modelName: item.equipmentModel.name,
			modelType: item.equipmentModel.type,
			status: item.status,
			areaName: areaLookup.get(item.areaId)?.areaName ?? item.areaId,
			branchName: areaLookup.get(item.areaId)?.branchName ?? "Unknown branch",
			createdBy: item.createdBy.name,
			createdAt: new Intl.DateTimeFormat("en-US", {
				month: "short",
				day: "2-digit",
				year: "numeric",
			}).format(item.createdAt),
		}));

		console.log("[Equipment Action] Fetched equipment", {
			traceId,
			count: formattedEquipment.length,
		});

		if (redisUrl && redisToken) {
			try {
				await runRedisCommand<string>(redisUrl, redisToken, [
					"SET",
					EQUIPMENT_CACHE_KEY,
					JSON.stringify(formattedEquipment),
					"EX",
					EQUIPMENT_CACHE_TTL_SECONDS,
				]);

				console.log("[Equipment Action] Cache updated", {
					traceId,
					key: EQUIPMENT_CACHE_KEY,
					ttlSeconds: EQUIPMENT_CACHE_TTL_SECONDS,
				});
			} catch (cacheWriteError) {
				console.warn("[Equipment Action] Cache write failed", {
					traceId,
					error:
						cacheWriteError instanceof Error ? cacheWriteError.message : "Unknown cache write error",
				});
			}
		}

		return {
			ok: true,
			equipment: formattedEquipment,
		};
	} catch (error) {
		console.error("[Equipment Action] Fetch failed", {
			traceId,
			error: error instanceof Error ? error.message : "Unknown error",
		});

		return {
			ok: false,
			message: "Unable to fetch equipment right now.",
		};
	}
}

function isValidEquipmentStatus(status: string): status is EquipmentStatus {
	return status === "AVAILABLE" || status === "MAINTENANCE" || status === "RETIRED" || status === "LOST";
}

export async function createEquipmentAction(input: {
	equipmentModelId: string;
	status: EquipmentStatus;
	areaId: string; // areaId is now a plain string
}): Promise<CreateEquipmentResult> {
	const traceId = `equipment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			console.warn("[Equipment Action] Unauthorized create attempt", { traceId });
			return {
				ok: false,
				message: "You must be logged in to create equipment.",
			};
		}

		const normalizedEquipmentModelId = input.equipmentModelId?.trim();
		const normalizedAreaId = input.areaId?.trim();
		const normalizedStatus = input.status?.trim();
		const generatedSku = generateEquipmentSku();
		const generatedQrCode = buildEquipmentQrCodeUrl(generatedSku);

		if (!normalizedEquipmentModelId) {
			return {
				ok: false,
				message: "Equipment model is required.",
			};
		}

		if (!normalizedAreaId) {
			return {
				ok: false,
				message: "Area is required.",
			};
		}

		if (!isValidEquipmentStatus(normalizedStatus)) {
			return {
				ok: false,
				message: "Invalid equipment status.",
			};
		}

		const equipmentModelsResult = await fetchEquipmentModelsAction();

		if (!equipmentModelsResult.ok) {
			return {
				ok: false,
				message: equipmentModelsResult.message,
			};
		}

		const modelExists = equipmentModelsResult.models.some(
			(model) => model.id === normalizedEquipmentModelId,
		);

		if (!modelExists) {
			return {
				ok: false,
				message: "Selected equipment model was not found. Please refresh and try again.",
			};
		}

		const equipment = await prisma.equipment.create({
			data: {
				qrCode: generatedQrCode,
				sku: generatedSku,
				equipmentModelId: normalizedEquipmentModelId,
				status: normalizedStatus,
				areaId: normalizedAreaId, // areaId is now stored as a plain string
				createdById: session.user.id,
			},
			select: {
				id: true,
				qrCode: true,
				sku: true,
			},
		});

		console.log("[Equipment Action] Equipment created successfully", {
			traceId,
			equipmentId: equipment.id,
			sku: equipment.sku,
			qrCode: equipment.qrCode,
		});

		await invalidateEquipmentCaches();

		return {
			ok: true,
			equipmentId: equipment.id,
			message: "Equipment created successfully.",
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

		console.error("[Equipment Action] Create failed", {
			traceId,
			error: errorMessage,
		});

		if (errorMessage.includes("Unique constraint failed")) {
			return {
				ok: false,
				message: "QR code already exists. Please use a different value.",
			};
		}

		return {
			ok: false,
			message: `Unable to create equipment: ${errorMessage}`,
		};
	}
}
