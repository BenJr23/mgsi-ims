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

const VALID_EQUIPMENT_TYPES: EquipmentType[] = [
	"FURNITURE",
	"ELECTRONICS",
	"APPLIANCE",
	"TOOL",
	"OTHER",
];

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
