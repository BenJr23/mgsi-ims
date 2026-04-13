"use server";

import { prisma } from '@/lib/prisma';

export type ProductDetailItem = {
	id: string;
	sku: string | null;
	qrCode: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	equipmentModel: {
		name: string;
		type: string;
		price: unknown;
	};
	createdBy: {
		name: string;
		email: string;
	};
};

export type ProductPrintItem = {
	id: string;
	sku: string | null;
	status: string;
	qrCode: string;
	modelName: string;
	modelType: string;
};

type ProductDetailResult =
	| {
			ok: true;
			item: ProductDetailItem;
		}
	| {
			ok: false;
			message: string;
		};

type ProductPrintResult =
	| {
			ok: true;
			item: ProductPrintItem;
		}
	| {
			ok: false;
			message: string;
		};

export async function fetchProductDetailByIdAction(id: string): Promise<ProductDetailResult> {
	try {
		const item = await prisma.equipment.findFirst({
			where: {
				id,
				deletedAt: null,
			},
			select: {
				id: true,
				sku: true,
				qrCode: true,
				status: true,
				createdAt: true,
				updatedAt: true,
				equipmentModel: {
					select: {
						name: true,
						type: true,
						price: true,
					},
				},
				createdBy: {
					select: {
						name: true,
						email: true,
					},
				},
			},
		});

		if (!item) {
			return {
				ok: false,
				message: 'Product not found.',
			};
		}

		return {
			ok: true,
			item,
		};
	} catch (error) {
		console.error('[Product Action] Failed to fetch product detail', {
			id,
			error: error instanceof Error ? error.message : 'Unknown error',
		});

		return {
			ok: false,
			message: 'Unable to load product details right now.',
		};
	}
}

export async function fetchProductPrintByIdAction(id: string): Promise<ProductPrintResult> {
	try {
		const item = await prisma.equipment.findFirst({
			where: {
				id,
				deletedAt: null,
			},
			select: {
				id: true,
				sku: true,
				status: true,
				qrCode: true,
				equipmentModel: {
					select: {
						name: true,
						type: true,
					},
				},
			},
		});

		if (!item) {
			return {
				ok: false,
				message: 'Product not found.',
			};
		}

		return {
			ok: true,
			item: {
				id: item.id,
				sku: item.sku,
				status: item.status,
				qrCode: item.qrCode,
				modelName: item.equipmentModel.name,
				modelType: item.equipmentModel.type,
			},
		};
	} catch (error) {
		console.error('[Product Action] Failed to fetch product print data', {
			id,
			error: error instanceof Error ? error.message : 'Unknown error',
		});

		return {
			ok: false,
			message: 'Unable to load product print data right now.',
		};
	}
}