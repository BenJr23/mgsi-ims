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

export type EquipmentModelListItem = {
	id: string;
	name: string;
	description: string;
	sku: string | null;
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

const VALID_EQUIPMENT_TYPES: EquipmentType[] = [
	"FURNITURE",
	"ELECTRONICS",
	"APPLIANCE",
	"TOOL",
	"OTHER",
];

export async function fetchEquipmentModelsAction(): Promise<FetchEquipmentModelsResult> {
	const traceId = `equipment_model_fetch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

	try {
		const models = await prisma.equipmentModel.findMany({
			where: {
				deletedAt: null,
			},
			select: {
				id: true,
				name: true,
				description: true,
				sku: true,
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
			sku: model.sku,
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
	sku: string;
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
		const normalizedSku = input.sku?.trim() || null;
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

		const parsedPrice = normalizedPrice ? Number(normalizedPrice) : null;
		if (normalizedPrice && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
			return {
				ok: false,
				message: "Price must be a valid non-negative number.",
			};
		}

		const equipmentModel = await prisma.equipmentModel.create({
			data: {
				name: normalizedName,
				description: normalizedDescription,
				sku: normalizedSku,
				type: input.type,
				price: parsedPrice,
				createdById: session.user.id,
			},
			select: {
				id: true,
				name: true,
				sku: true,
			},
		});

		console.log("[EquipmentModel Action] Created successfully", {
			traceId,
			equipmentModelId: equipmentModel.id,
			name: equipmentModel.name,
			sku: equipmentModel.sku,
		});

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

		if (errorMessage.includes("Unique constraint failed")) {
			return {
				ok: false,
				message: "SKU already exists. Please use a different SKU.",
			};
		}

		return {
			ok: false,
			message: `Unable to create equipment model: ${errorMessage}`,
		};
	}
}
