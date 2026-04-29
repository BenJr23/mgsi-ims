"use server";

import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { fetchBranchesAction } from "@/app/_actions/branches";
import { fetchEquipmentModelsAction } from "@/app/_actions/equipmentmodel";

type EquipmentStatus = "AVAILABLE" | "MAINTENANCE" | "RETIRED" | "LOST";
type EquipmentHistoryEvent =
	| "INITIAL"
	| "LOCATION_CHANGED"
	| "STATUS_CHANGED"
	| "LOCATION_AND_STATUS_CHANGED"
	| "DELETED";

type CreateEquipmentResult =
	| {
			ok: true;
			equipmentId: string;
			createdCount: number;
			message: string;
		}
	| {
			ok: false;
			message: string;
		};

type UpdateEquipmentResult =
	| {
			ok: true;
			equipmentId: string;
			message: string;
		}
	| {
			ok: false;
			message: string;
		};

type DeleteEquipmentResult =
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
	equipmentModelId: string;
	areaId: string;
	purchaseDate: string | null;
	modelName: string;
	modelType: string;
	status: EquipmentStatus;
	areaName: string;
	branchName: string;
	createdBy: string;
	createdAt: string;
};

export type EquipmentLookupDetail = {
	id: string;
	qrCode: string;
	sku: string;
	status: EquipmentStatus;
	modelName: string;
	modelType: string;
	areaId: string;
	branchId: string;
	areaName: string;
	branchName: string;
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

type FindEquipmentBySkuResult =
	| {
			ok: true;
			equipment: EquipmentLookupDetail;
		}
	| {
			ok: false;
			message: string;
		};


const EQUIPMENT_CACHE_KEY = "equipment:all:v2";
const BRANCHES_CACHE_KEY = "branches:all:v2";
const EQUIPMENT_MODELS_CACHE_KEY = "equipment-models:all:v1";
const EQUIPMENT_CACHE_TTL_SECONDS = 300;
const EQUIPMENT_ROUTE_PREFIX = "/equipment";

function toHttpsUrl(rawUrl: string): string {
	const trimmed = rawUrl.trim().replace(/\/$/, "");
	if (!trimmed) {
		return "";
	}

	if (/^https?:\/\//i.test(trimmed)) {
		return trimmed;
	}

	return `https://${trimmed}`;
}

function getAppBaseUrl(): string {
	const configuredUrlCandidates = [
		process.env.NEXT_PUBLIC_QR_BASE_URL,
		process.env.NEXT_PUBLIC_APP_URL,
		process.env.NEXTAUTH_URL,
		process.env.VERCEL_PROJECT_PRODUCTION_URL,
	].filter((value): value is string => Boolean(value?.trim()));

	for (const candidate of configuredUrlCandidates) {
		const normalized = toHttpsUrl(candidate);
		if (!normalized) {
			continue;
		}

		try {
			const parsed = new URL(normalized);
			if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
				continue;
			}

			return `${parsed.protocol}//${parsed.host}`;
		} catch {
			continue;
		}
	}

	throw new Error(
		"QR base URL is not configured with a deployed domain. Set NEXT_PUBLIC_QR_BASE_URL to your production URL.",
	);
}

function generateEquipmentSku(): string {
	const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
	const timestamp = Date.now().toString(36).toUpperCase();
	return `EQ-${timestamp}-${randomSuffix}`;
}

function buildEquipmentQrCodeUrl(sku: string): string {
	return `${getAppBaseUrl()}${EQUIPMENT_ROUTE_PREFIX}/${encodeURIComponent(sku)}`;
}

async function generateDeterministicSkuWithPrefix(tx: any, prefix: string): Promise<string> {
	const existing = await tx.equipment.findMany({
		where: {
			sku: { startsWith: `${prefix}-` },
		},
		select: { sku: true },
	});

	let maxSeq = 0;
	const expectedPrefix = `${prefix}-`;
	for (const e of existing) {
		if (!e.sku) continue;
		if (!e.sku.startsWith(expectedPrefix)) continue;
		const suffix = e.sku.slice(expectedPrefix.length);
		if (/^\d{4}$/.test(suffix)) {
			const v = parseInt(suffix, 10);
			if (!Number.isNaN(v) && v > maxSeq) maxSeq = v;
		}
	}

	const nextSeq = maxSeq + 1;
	const seqStr = String(nextSeq).padStart(4, "0");

	return `${prefix}-${seqStr}`;
}

function parsePurchaseDateInput(value: string | null | undefined): Date | null {
	const trimmed = value?.trim();

	if (!trimmed) {
		return null;
	}

	const parsedDate = new Date(trimmed);

	if (Number.isNaN(parsedDate.getTime())) {
		throw new Error("Invalid purchase date.");
	}

	return parsedDate;
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

async function removeSoftDeletedFromCachedEquipment(
	cachedEquipment: EquipmentListItem[],
): Promise<EquipmentListItem[]> {
	if (cachedEquipment.length === 0) {
		return cachedEquipment;
	}

	const activeEquipment = await prisma.equipment.findMany({
		where: {
			id: {
				in: cachedEquipment.map((item) => item.id),
			},
			deletedAt: null,
		},
		select: {
			id: true,
		},
	});

	const activeEquipmentIds = new Set(activeEquipment.map((item) => item.id));

	return cachedEquipment.filter((item) => activeEquipmentIds.has(item.id));
}

type FetchEquipmentOptions = {
	areaId?: string;
};

export async function fetchEquipmentAction(
	options: FetchEquipmentOptions = {},
): Promise<FetchEquipmentResult> {
	const traceId = `equipment_fetch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
	const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
	const selectedAreaId = options.areaId?.trim() ?? "";
	const applyAreaFilter = Boolean(selectedAreaId);

	const filterBySelectedArea = (equipment: EquipmentListItem[]) => {
		if (!applyAreaFilter) {
			return equipment;
		}

		return equipment.filter((item) => item.areaId === selectedAreaId);
	};

	try {
		if (redisUrl && redisToken) {
			try {
				const cacheResponse = await runRedisCommand<string | null>(redisUrl, redisToken, [
					"GET",
					EQUIPMENT_CACHE_KEY,
				]);

				if (cacheResponse.result) {
					const cachedEquipment = JSON.parse(cacheResponse.result) as EquipmentListItem[];
					const sanitizedEquipment = await removeSoftDeletedFromCachedEquipment(cachedEquipment);
					const filteredEquipment = filterBySelectedArea(sanitizedEquipment);

					if (sanitizedEquipment.length !== cachedEquipment.length) {
						console.log("[Equipment Action] Removed soft-deleted rows from cache payload", {
							traceId,
							key: EQUIPMENT_CACHE_KEY,
							before: cachedEquipment.length,
							after: sanitizedEquipment.length,
						});

						try {
							await runRedisCommand<string>(redisUrl, redisToken, [
								"SET",
								EQUIPMENT_CACHE_KEY,
								JSON.stringify(sanitizedEquipment),
								"EX",
								EQUIPMENT_CACHE_TTL_SECONDS,
							]);
						} catch (cacheWriteError) {
							console.warn("[Equipment Action] Cache write failed after soft-delete reconciliation", {
								traceId,
								error:
									cacheWriteError instanceof Error
										? cacheWriteError.message
										: "Unknown cache write error",
							});
						}
					}

					console.log("[Equipment Action] Cache hit", {
						traceId,
						key: EQUIPMENT_CACHE_KEY,
						count: filteredEquipment.length,
					});

					return {
						ok: true,
						equipment: filteredEquipment,
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
				equipmentModelId: true,
				status: true,
				purchaseDate: true,
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
			equipmentModelId: item.equipmentModelId,
			areaId: item.areaId,
			purchaseDate: item.purchaseDate ? item.purchaseDate.toISOString().slice(0, 10) : null,
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

		const filteredEquipment = filterBySelectedArea(formattedEquipment);

		console.log("[Equipment Action] Fetched equipment", {
			traceId,
			count: filteredEquipment.length,
			areaId: selectedAreaId || null,
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
			equipment: filteredEquipment,
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

export async function findEquipmentBySkuAction(
	sku: string,
): Promise<FindEquipmentBySkuResult> {
	const traceId = `equipment_lookup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	const normalizedSku = sku.trim();
	console.log("[Equipment Action] Lookup start", { traceId, sku, normalizedSku });

	if (!normalizedSku) {
		console.warn("[Equipment Action] Lookup failed: empty SKU", { traceId, sku });
		return {
			ok: false,
			message: "SKU is required.",
		};
	}

	try {
		const equipment = await prisma.equipment.findFirst({
			where: {
				sku: {
					equals: normalizedSku,
					mode: "insensitive",
				},
				deletedAt: null,
			},
			select: {
				id: true,
				qrCode: true,
				sku: true,
				status: true,
				areaId: true,
				equipmentModel: {
					select: {
						name: true,
						type: true,
					},
				},
			},
		});

		if (!equipment || !equipment.sku) {
			console.warn("[Equipment Action] Lookup no match", {
				traceId,
				normalizedSku,
			});
			return {
				ok: false,
				message: "No equipment found for this SKU.",
			};
		}

		const branchesResult = await fetchBranchesAction();
		const matchedBranch = branchesResult.ok
			? branchesResult.branches.find((branch) =>
				(branch.areas ?? []).some((area) => area.id === equipment.areaId),
			)
			: null;
		const matchedArea = matchedBranch?.areas?.find((area) => area.id === equipment.areaId) ?? null;

		return {
			ok: true,
			equipment: {
				id: equipment.id,
				qrCode: equipment.qrCode,
				sku: equipment.sku,
				status: equipment.status,
				modelName: equipment.equipmentModel.name,
				modelType: equipment.equipmentModel.type,
				areaId: equipment.areaId,
				branchId: matchedBranch?.id ?? "",
				areaName: matchedArea?.name ?? equipment.areaId,
				branchName: matchedBranch?.name ?? "Unknown branch",
			},
		};
	} catch (error) {
		console.error("[Equipment Action] Lookup failed", {
			traceId,
			error: error instanceof Error ? error.message : "Unknown error",
		});

		return {
			ok: false,
			message: "Unable to look up equipment right now.",
		};
	}
}

function isValidEquipmentStatus(status: string): status is EquipmentStatus {
	return status === "AVAILABLE" || status === "MAINTENANCE" || status === "RETIRED" || status === "LOST";
}

function getHistoryEvent(areaChanged: boolean, statusChanged: boolean): EquipmentHistoryEvent {
	if (areaChanged && statusChanged) {
		return "LOCATION_AND_STATUS_CHANGED";
	}

	if (areaChanged) {
		return "LOCATION_CHANGED";
	}

	return "STATUS_CHANGED";
}

async function logEquipmentAudit(input: {
	action: string;
	status: "SUCCESS" | "FAILED";
	message: string;
	userId?: string | null;
	severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}) {
	await createAuditLog({
		action: input.action,
		module: "Equipment",
		status: input.status,
		severity: input.severity ?? (input.status === "SUCCESS" ? "LOW" : "MEDIUM"),
		message: input.message,
		userId: input.userId ?? null,
	});
}

export async function createEquipmentAction(input: {
	equipmentModelId: string;
	status: EquipmentStatus;
	areaId: string; // areaId is now a plain string
	purchaseDate: string | null;
	quantity: number;
}): Promise<CreateEquipmentResult> {
	const traceId = `equipment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	let auditUserId: string | null = null;

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			console.warn("[Equipment Action] Unauthorized create attempt", { traceId });
			await logEquipmentAudit({
				action: "Create equipment",
				status: "FAILED",
				severity: "HIGH",
				message: "Unauthorized create equipment attempt.",
			});
			return {
				ok: false,
				message: "You must be logged in to create equipment.",
			};
		}

		auditUserId = session.user.id;

		const normalizedEquipmentModelId = input.equipmentModelId?.trim();
		const normalizedAreaId = input.areaId?.trim();
		const normalizedStatus = input.status?.trim();
		const normalizedPurchaseDate = parsePurchaseDateInput(input.purchaseDate);
		const requestedQuantity = Number.isFinite(input.quantity)
			? Math.trunc(input.quantity)
			: 0;

		if (!normalizedEquipmentModelId) {
			await logEquipmentAudit({
				action: "Create equipment",
				status: "FAILED",
				message: "Create failed: Equipment model is required.",
				userId: session.user.id,
			});
			return {
				ok: false,
				message: "Equipment model is required.",
			};
		}

		if (!normalizedAreaId) {
			await logEquipmentAudit({
				action: "Create equipment",
				status: "FAILED",
				message: "Create failed: Area is required.",
				userId: session.user.id,
			});
			return {
				ok: false,
				message: "Area is required.",
			};
		}

		if (!isValidEquipmentStatus(normalizedStatus)) {
			await logEquipmentAudit({
				action: "Create equipment",
				status: "FAILED",
				message: `Create failed: Invalid status (${normalizedStatus}).`,
				userId: session.user.id,
			});
			return {
				ok: false,
				message: "Invalid equipment status.",
			};
		}

		if (requestedQuantity < 1 || requestedQuantity > 200) {
			await logEquipmentAudit({
				action: "Create equipment",
				status: "FAILED",
				message: `Create failed: Invalid quantity (${requestedQuantity}).`,
				userId: session.user.id,
			});
			return {
				ok: false,
				message: "Quantity must be between 1 and 200.",
			};
		}

		const equipmentModelsResult = await fetchEquipmentModelsAction();

		if (!equipmentModelsResult.ok) {
			await logEquipmentAudit({
				action: "Create equipment",
				status: "FAILED",
				message: `Create failed: ${equipmentModelsResult.message}`,
				userId: session.user.id,
			});
			return {
				ok: false,
				message: equipmentModelsResult.message,
			};
		}

		const modelExists = equipmentModelsResult.models.some(
			(model) => model.id === normalizedEquipmentModelId,
		);

		if (!modelExists) {
			await logEquipmentAudit({
				action: "Create equipment",
				status: "FAILED",
				message: `Create failed: Equipment model ${normalizedEquipmentModelId} not found.`,
				userId: session.user.id,
			});
			return {
				ok: false,
				message: "Selected equipment model was not found. Please refresh and try again.",
			};
		}

		// Resolve area code (local area first, then API branches) and model code before transaction
		let resolvedAreaCode = null;
		try {
			const localArea = await prisma.area.findUnique({
				where: { id: normalizedAreaId },
				select: { roomCode: true, roomName: true },
			});

			if (localArea) {
				resolvedAreaCode = (localArea.roomCode ?? localArea.roomName ?? normalizedAreaId)
					.toString()
					.trim()
					;
			}
		} catch {
			// ignore lookup errors and fall back to branches API
		}

		if (!resolvedAreaCode) {
			const branchesResult = await fetchBranchesAction();
			if (branchesResult.ok) {
				for (const branch of branchesResult.branches) {
					const found = (branch.areas ?? []).find((a) => a.id === normalizedAreaId);
					if (found) {
						resolvedAreaCode = (found.code ?? found.name ?? normalizedAreaId)
							.toString()
							.trim()
							;
						break;
					}
				}
			}
		}

		// Fallback to raw areaId if nothing else
		if (!resolvedAreaCode) resolvedAreaCode = normalizedAreaId.trim();

		const modelFromCache = equipmentModelsResult.models.find((m) => m.id === normalizedEquipmentModelId);
		const resolvedModelCode = (modelFromCache?.modelCode ?? modelFromCache?.name ?? normalizedEquipmentModelId)
			.toString()
			.trim()
			.toUpperCase();

		const clean = (s: string) => s.replace(/[^A-Z0-9]/g, "");
		const prefix = `${resolvedAreaCode}-${clean(resolvedModelCode)}`;

		const MAX_ATTEMPTS = 5;
		let createdEquipment: Array<{ id: string; sku: string | null; qrCode: string }> = [];

		for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
			try {
				createdEquipment = await prisma.$transaction(async (tx) => {
					const createdRows: Array<{ id: string; sku: string | null; qrCode: string }> = [];

					for (let i = 0; i < requestedQuantity; i += 1) {
						const generatedSku = await generateDeterministicSkuWithPrefix(tx, prefix);
						const generatedQrCode = buildEquipmentQrCodeUrl(generatedSku);

						const created = await tx.equipment.create({
							data: {
								qrCode: generatedQrCode,
								sku: generatedSku,
								equipmentModelId: normalizedEquipmentModelId,
								status: normalizedStatus,
								areaId: normalizedAreaId,
								purchaseDate: normalizedPurchaseDate,
								createdById: session.user.id,
							},
							select: {
								id: true,
								sku: true,
								qrCode: true,
							},
						});

						await tx.equipmentLocationHistory.create({
							data: {
								equipmentId: created.id,
								areaId: normalizedAreaId,
								status: normalizedStatus,
								event: "INITIAL",
								changedById: session.user.id,
							},
						});

						createdRows.push(created);
					}

					return createdRows;
				});

				break;
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : String(err);
				if (errMsg.includes("Unique constraint failed") && attempt < MAX_ATTEMPTS - 1) {
					console.warn("[Equipment Action] SKU collision detected, retrying transaction", { traceId, attempt });
					await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
					continue;
				}

				throw err;
			}
		}

		const firstCreated = createdEquipment[0];

		console.log("[Equipment Action] Equipment created successfully", {
			traceId,
			createdCount: createdEquipment.length,
			firstEquipmentId: firstCreated?.id,
		});

		await invalidateEquipmentCaches();

		await logEquipmentAudit({
			action: "Create equipment",
			status: "SUCCESS",
			message: `Created ${createdEquipment.length} equipment item(s). First ID: ${firstCreated.id}.`,
			userId: session.user.id,
		});

		return {
			ok: true,
			equipmentId: firstCreated.id,
			createdCount: createdEquipment.length,
			message:
				createdEquipment.length === 1
					? "Equipment created successfully."
					: `${createdEquipment.length} equipment items created successfully.`,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

		console.error("[Equipment Action] Create failed", {
			traceId,
			error: errorMessage,
		});

		if (errorMessage.includes("Unique constraint failed")) {
			await logEquipmentAudit({
				action: "Create equipment",
				status: "FAILED",
				severity: "HIGH",
				message: "Create failed: Unique constraint violation while generating QR/SKU.",
				userId: auditUserId,
			});
			return {
				ok: false,
				message: "QR code already exists. Please use a different value.",
			};
		}

		await logEquipmentAudit({
			action: "Create equipment",
			status: "FAILED",
			severity: "HIGH",
			message: `Create failed: ${errorMessage}`,
			userId: auditUserId,
		});

		return {
			ok: false,
			message: `Unable to create equipment: ${errorMessage}`,
		};
	}
}

export async function updateEquipmentAction(input: {
	equipmentId: string;
	status: EquipmentStatus;
	areaId: string;
	purchaseDate: string | null;
}): Promise<UpdateEquipmentResult> {
	const traceId = `equipment_update_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	let auditUserId: string | null = null;

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			await logEquipmentAudit({
				action: "Update equipment",
				status: "FAILED",
				severity: "HIGH",
				message: "Unauthorized update equipment attempt.",
			});
			return {
				ok: false,
				message: "You must be logged in to update equipment.",
			};
		}

		auditUserId = session.user.id;

		const equipmentId = input.equipmentId?.trim();
		const areaId = input.areaId?.trim();
		const normalizedPurchaseDate = parsePurchaseDateInput(input.purchaseDate);

		if (!equipmentId) {
			await logEquipmentAudit({
				action: "Update equipment",
				status: "FAILED",
				message: "Update failed: Equipment ID is required.",
				userId: session.user.id,
			});
			return {
				ok: false,
				message: "Equipment ID is required.",
			};
		}

		if (!areaId) {
			await logEquipmentAudit({
				action: "Update equipment",
				status: "FAILED",
				message: "Update failed: Area is required.",
				userId: session.user.id,
			});
			return {
				ok: false,
				message: "Area is required.",
			};
		}

		if (!isValidEquipmentStatus(input.status)) {
			await logEquipmentAudit({
				action: "Update equipment",
				status: "FAILED",
				message: `Update failed: Invalid status (${input.status}).`,
				userId: session.user.id,
			});
			return {
				ok: false,
				message: "Invalid equipment status.",
			};
		}

		const existingEquipment = await prisma.equipment.findFirst({
			where: {
				id: equipmentId,
				deletedAt: null,
			},
			select: {
				id: true,
				areaId: true,
				status: true,
			},
		});

		if (!existingEquipment) {
			await logEquipmentAudit({
				action: "Update equipment",
				status: "FAILED",
				message: `Update failed: Equipment ${equipmentId} not found.`,
				userId: session.user.id,
			});
			return {
				ok: false,
				message: "Equipment not found or already deleted.",
			};
		}

		const areaChanged = existingEquipment.areaId !== areaId;
		const statusChanged = existingEquipment.status !== input.status;

		if (!areaChanged && !statusChanged) {
			return {
				ok: true,
				equipmentId,
				message: "No changes detected.",
			};
		}

		const historyEvent = getHistoryEvent(areaChanged, statusChanged);

		await prisma.$transaction(async (tx) => {
			await tx.equipment.update({
				where: {
					id: equipmentId,
				},
				data: {
					status: input.status,
					areaId,
					purchaseDate: normalizedPurchaseDate,
				},
				select: {
					id: true,
				},
			});

			await tx.equipmentLocationHistory.create({
				data: {
					equipmentId,
					areaId,
					status: input.status,
					event: historyEvent,
					changedById: session.user.id,
				},
			});
		});

		await invalidateEquipmentCaches();

		await logEquipmentAudit({
			action: "Update equipment",
			status: "SUCCESS",
			message: `Updated equipment ${equipmentId} with status ${input.status} and area ${areaId}.`,
			userId: session.user.id,
		});

		console.log("[Equipment Action] Equipment updated successfully", {
			traceId,
			equipmentId,
		});

		return {
			ok: true,
			equipmentId,
			message: "Equipment updated successfully.",
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

		console.error("[Equipment Action] Update failed", {
			traceId,
			error: errorMessage,
		});

		await logEquipmentAudit({
			action: "Update equipment",
			status: "FAILED",
			severity: "HIGH",
			message: `Update failed: ${errorMessage}`,
			userId: auditUserId,
		});

		return {
			ok: false,
			message: `Unable to update equipment: ${errorMessage}`,
		};
	}
}

export async function deleteEquipmentAction(input: {
	equipmentId: string;
}): Promise<DeleteEquipmentResult> {
	const traceId = `equipment_delete_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	let auditUserId: string | null = null;

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			await logEquipmentAudit({
				action: "Delete equipment",
				status: "FAILED",
				severity: "HIGH",
				message: "Unauthorized delete equipment attempt.",
			});
			return {
				ok: false,
				message: "You must be logged in to delete equipment.",
			};
		}

		auditUserId = session.user.id;

		const equipmentId = input.equipmentId?.trim();
		if (!equipmentId) {
			await logEquipmentAudit({
				action: "Delete equipment",
				status: "FAILED",
				message: "Delete failed: Equipment ID is required.",
				userId: session.user.id,
			});
			return {
				ok: false,
				message: "Equipment ID is required.",
			};
		}

		const existingEquipment = await prisma.equipment.findFirst({
			where: {
				id: equipmentId,
				deletedAt: null,
			},
			select: {
				id: true,
				areaId: true,
				status: true,
			},
		});

		if (!existingEquipment) {
			await logEquipmentAudit({
				action: "Delete equipment",
				status: "FAILED",
				message: `Delete failed: Equipment ${equipmentId} not found.`,
				userId: session.user.id,
			});
			return {
				ok: false,
				message: "Equipment not found or already deleted.",
			};
		}

		await prisma.$transaction(async (tx) => {
			await tx.equipment.update({
				where: {
					id: equipmentId,
				},
				data: {
					deletedAt: new Date(),
				},
				select: {
					id: true,
				},
			});

			await tx.equipmentLocationHistory.create({
				data: {
					equipmentId,
					areaId: existingEquipment.areaId,
					status: existingEquipment.status,
					event: "DELETED",
					changedById: session.user.id,
				},
			});
		});

		await invalidateEquipmentCaches();

		await logEquipmentAudit({
			action: "Delete equipment",
			status: "SUCCESS",
			message: `Deleted equipment ${equipmentId}.`,
			userId: session.user.id,
		});

		console.log("[Equipment Action] Equipment deleted successfully", {
			traceId,
			equipmentId,
		});

		return {
			ok: true,
			equipmentId,
			message: "Equipment deleted successfully.",
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

		console.error("[Equipment Action] Delete failed", {
			traceId,
			error: errorMessage,
		});

		await logEquipmentAudit({
			action: "Delete equipment",
			status: "FAILED",
			severity: "HIGH",
			message: `Delete failed: ${errorMessage}`,
			userId: auditUserId,
		});

		return {
			ok: false,
			message: `Unable to delete equipment: ${errorMessage}`,
		};
	}
}
