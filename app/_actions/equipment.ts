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

const EQUIPMENT_CACHE_KEY = "equipment:all:v1";
const BRANCHES_CACHE_KEY = "branches:all:v2";
const EQUIPMENT_MODELS_CACHE_KEY = "equipment-models:all:v1";

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

function isValidEquipmentStatus(status: string): status is EquipmentStatus {
	return status === "AVAILABLE" || status === "MAINTENANCE" || status === "RETIRED" || status === "LOST";
}

export async function createEquipmentAction(input: {
	qrCode: string;
	serialNumber: string | null;
	equipmentModelId: string;
	status: EquipmentStatus;
	areaId: string;
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

		const normalizedQrCode = input.qrCode?.trim();
		const normalizedSerialNumber = input.serialNumber?.trim() || null;
		const normalizedEquipmentModelId = input.equipmentModelId?.trim();
		const normalizedAreaId = input.areaId?.trim();
		const normalizedStatus = input.status?.trim();

		if (!normalizedQrCode) {
			return {
				ok: false,
				message: "QR code is required.",
			};
		}

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
			return {
				ok: false,
				message: equipmentModelsResult.message,
			};
		}

		const areaExists = branchesResult.branches.some((branch) =>
			(branch.areas ?? []).some((area) => area.id === normalizedAreaId),
		);

		if (!areaExists) {
			return {
				ok: false,
				message: "Selected area was not found. Please refresh and try again.",
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
				qrCode: normalizedQrCode,
				serialNumber: normalizedSerialNumber,
				equipmentModelId: normalizedEquipmentModelId,
				status: normalizedStatus,
				areaId: normalizedAreaId,
				createdById: session.user.id,
			},
			select: {
				id: true,
				qrCode: true,
			},
		});

		console.log("[Equipment Action] Equipment created successfully", {
			traceId,
			equipmentId: equipment.id,
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
				message: "QR code or serial number already exists. Please use a different value.",
			};
		}

		return {
			ok: false,
			message: `Unable to create equipment: ${errorMessage}`,
		};
	}
}
