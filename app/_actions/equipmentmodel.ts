"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

type EquipmentType =
	| "FURNITURE"
	| "ELECTRONICS"
	| "APPLIANCE"
	| "TOOL"
	| "OTHER";

type CreateEquipmentModelResult =
	| {
			ok: true;
			equipmentModelId: string;
			message: string;
		}
	| {
			ok: false;
			message: string;
		};

type UpdateEquipmentModelResult =
	| {
			ok: true;
			equipmentModelId: string;
			message: string;
		}
	| {
			ok: false;
			message: string;
		};

type DeleteEquipmentModelResult =
	| {
			ok: true;
			equipmentModelId: string;
			message: string;
		}
	| {
			ok: false;
			message: string;
		};

export type EquipmentModelListItem = {
	id: string;
	name: string;
	description: string;
	type: EquipmentType;
	price: string | null;
	createdBy: string;
	createdAt: string;
	unitCount: number;
};

type FetchEquipmentModelsResult =
	| {
			ok: true;
			models: EquipmentModelListItem[];
		}
	| {
			ok: false;
			message: string;
		};

const EQUIPMENT_MODELS_CACHE_KEY = "equipment-models:all:v1";
const EQUIPMENT_MODELS_CACHE_TTL_SECONDS = 300;

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

async function invalidateEquipmentModelsCache(): Promise<void> {
	const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
	const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

	if (!redisUrl || !redisToken) {
		console.warn("[EquipmentModel Action] Redis not configured, skipping cache invalidation");
		return;
	}

	try {
		await runRedisCommand<number>(redisUrl, redisToken, ["DEL", EQUIPMENT_MODELS_CACHE_KEY]);
		console.log("[EquipmentModel Action] Cache invalidated", {
			key: EQUIPMENT_MODELS_CACHE_KEY,
		});
	} catch (error) {
		console.warn("[EquipmentModel Action] Cache invalidation failed", {
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

const VALID_EQUIPMENT_TYPES: EquipmentType[] = [
	"FURNITURE",
	"ELECTRONICS",
	"APPLIANCE",
	"TOOL",
	"OTHER",
];

export async function fetchEquipmentModelsAction(): Promise<FetchEquipmentModelsResult> {
	const traceId = `equipment_model_fetch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
	const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

	try {
		if (redisUrl && redisToken) {
			try {
				const cacheResponse = await runRedisCommand<string | null>(redisUrl, redisToken, [
					"GET",
					EQUIPMENT_MODELS_CACHE_KEY,
				]);

				if (cacheResponse.result) {
					const cachedModels = JSON.parse(cacheResponse.result) as EquipmentModelListItem[];
					console.log("[EquipmentModel Action] Cache hit", {
						traceId,
						key: EQUIPMENT_MODELS_CACHE_KEY,
						count: cachedModels.length,
					});

					return {
						ok: true,
						models: cachedModels,
					};
				}

				console.log("[EquipmentModel Action] Cache miss", {
					traceId,
					key: EQUIPMENT_MODELS_CACHE_KEY,
				});
			} catch (cacheReadError) {
				console.warn("[EquipmentModel Action] Cache read failed", {
					traceId,
					error:
						cacheReadError instanceof Error ? cacheReadError.message : "Unknown cache read error",
				});
			}
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

		const formattedModels: EquipmentModelListItem[] = models.map((model) => ({
			id: model.id,
			name: model.name,
			description: model.description ?? "",
			type: model.type,
			price: model.price ? model.price.toString() : null,
			createdBy: model.createdBy.name,
			createdAt: new Intl.DateTimeFormat("en-US", {
				month: "short",
				day: "2-digit",
				year: "numeric",
			}).format(model.createdAt),
			unitCount: model.equipment.length,
		}));

		console.log("[EquipmentModel Action] Fetched models", {
			traceId,
			count: formattedModels.length,
		});

		if (redisUrl && redisToken) {
			try {
				await runRedisCommand<string>(redisUrl, redisToken, [
					"SET",
					EQUIPMENT_MODELS_CACHE_KEY,
					JSON.stringify(formattedModels),
					"EX",
					EQUIPMENT_MODELS_CACHE_TTL_SECONDS,
				]);

				console.log("[EquipmentModel Action] Cache updated", {
					traceId,
					key: EQUIPMENT_MODELS_CACHE_KEY,
					ttlSeconds: EQUIPMENT_MODELS_CACHE_TTL_SECONDS,
				});
			} catch (cacheWriteError) {
				console.warn("[EquipmentModel Action] Cache write failed", {
					traceId,
					error:
						cacheWriteError instanceof Error ? cacheWriteError.message : "Unknown cache write error",
				});
			}
		}

		return {
			ok: true,
			models: formattedModels,
		};
	} catch (error) {
		console.error("[EquipmentModel Action] Fetch failed", {
			traceId,
			error: error instanceof Error ? error.message : "Unknown error",
		});

		return {
			ok: false,
			message: "Unable to fetch equipment models right now.",
		};
	}
}

export async function createEquipmentModelAction(input: {
	name: string;
	description: string;
	type: EquipmentType;
	price: string;
}): Promise<CreateEquipmentModelResult> {
	const traceId = `equipment_model_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			console.warn("[EquipmentModel Action] Unauthorized create attempt", { traceId });
			return {
				ok: false,
				message: "You must be logged in to create an equipment model.",
			};
		}

		const normalizedName = input.name?.trim();
		const normalizedDescription = input.description?.trim() || null;
		const normalizedPrice = input.price?.trim();

		if (!normalizedName) {
			return {
				ok: false,
				message: "Model name is required.",
			};
		}

		if (!VALID_EQUIPMENT_TYPES.includes(input.type)) {
			return {
				ok: false,
				message: "Invalid equipment type.",
			};
		}

		let parsedPrice: number | null = null;
		if (normalizedPrice) {
			parsedPrice = Number(normalizedPrice);
			if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
				return {
					ok: false,
					message: "Price must be a valid non-negative number.",
				};
			}
		}

		const equipmentModel = await prisma.equipmentModel.create({
			data: {
				name: normalizedName,
				description: normalizedDescription,
				type: input.type,
				price: parsedPrice,
				createdById: session.user.id,
			},
			select: {
				id: true,
				name: true,
			},
		});

		console.log("[EquipmentModel Action] Created successfully", {
			traceId,
			equipmentModelId: equipmentModel.id,
			name: equipmentModel.name,
		});

		await invalidateEquipmentModelsCache();

		return {
			ok: true,
			equipmentModelId: equipmentModel.id,
			message: "Equipment model created successfully.",
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

		console.error("[EquipmentModel Action] Create failed", {
			traceId,
			error: errorMessage,
		});

		return {
			ok: false,
			message: `Unable to create equipment model: ${errorMessage}`,
		};
	}
}

export async function updateEquipmentModelAction(input: {
	equipmentModelId: string;
	name: string;
	description: string;
	type: EquipmentType;
	price: string;
}): Promise<UpdateEquipmentModelResult> {
	const traceId = `equipment_model_update_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			console.warn("[EquipmentModel Action] Unauthorized update attempt", { traceId });
			return {
				ok: false,
				message: "You must be logged in to update an equipment model.",
			};
		}

		const equipmentModelId = input.equipmentModelId?.trim();
		const normalizedName = input.name?.trim();
		const normalizedDescription = input.description?.trim() || null;
		const normalizedPrice = input.price?.trim();

		if (!equipmentModelId) {
			return {
				ok: false,
				message: "Equipment model ID is required.",
			};
		}

		if (!normalizedName) {
			return {
				ok: false,
				message: "Model name is required.",
			};
		}

		if (!VALID_EQUIPMENT_TYPES.includes(input.type)) {
			return {
				ok: false,
				message: "Invalid equipment type.",
			};
		}

		let parsedPrice: number | null = null;
		if (normalizedPrice) {
			parsedPrice = Number(normalizedPrice);
			if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
				return {
					ok: false,
					message: "Price must be a valid non-negative number.",
				};
			}
		}

		const existingModel = await prisma.equipmentModel.findFirst({
			where: {
				id: equipmentModelId,
				deletedAt: null,
			},
			select: {
				id: true,
			},
		});

		if (!existingModel) {
			return {
				ok: false,
				message: "Equipment model not found or has already been deleted.",
			};
		}

		const updatedModel = await prisma.equipmentModel.update({
			where: {
				id: equipmentModelId,
			},
			data: {
				name: normalizedName,
				description: normalizedDescription,
				type: input.type,
				price: parsedPrice,
			},
			select: {
				id: true,
				name: true,
			},
		});

		console.log("[EquipmentModel Action] Updated successfully", {
			traceId,
			equipmentModelId: updatedModel.id,
			name: updatedModel.name,
		});

		await invalidateEquipmentModelsCache();

		return {
			ok: true,
			equipmentModelId: updatedModel.id,
			message: "Equipment model updated successfully.",
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

		console.error("[EquipmentModel Action] Update failed", {
			traceId,
			error: errorMessage,
		});

		return {
			ok: false,
			message: `Unable to update equipment model: ${errorMessage}`,
		};
	}
}

export async function deleteEquipmentModelAction(input: {
	equipmentModelId: string;
}): Promise<DeleteEquipmentModelResult> {
	const traceId = `equipment_model_delete_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			console.warn("[EquipmentModel Action] Unauthorized delete attempt", { traceId });
			return {
				ok: false,
				message: "You must be logged in to delete an equipment model.",
			};
		}

		const equipmentModelId = input.equipmentModelId?.trim();
		if (!equipmentModelId) {
			return {
				ok: false,
				message: "Equipment model ID is required.",
			};
		}

		const existingModel = await prisma.equipmentModel.findFirst({
			where: {
				id: equipmentModelId,
				deletedAt: null,
			},
			select: {
				id: true,
			},
		});

		if (!existingModel) {
			return {
				ok: false,
				message: "Equipment model not found or has already been deleted.",
			};
		}

		const deletedModel = await prisma.equipmentModel.update({
			where: {
				id: equipmentModelId,
			},
			data: {
				deletedAt: new Date(),
			},
			select: {
				id: true,
			},
		});

		console.log("[EquipmentModel Action] Deleted successfully", {
			traceId,
			equipmentModelId: deletedModel.id,
		});

		await invalidateEquipmentModelsCache();

		return {
			ok: true,
			equipmentModelId: deletedModel.id,
			message: "Equipment model deleted successfully.",
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

		console.error("[EquipmentModel Action] Delete failed", {
			traceId,
			error: errorMessage,
		});

		return {
			ok: false,
			message: `Unable to delete equipment model: ${errorMessage}`,
		};
	}
}