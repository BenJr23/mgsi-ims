"use server";

import { prisma } from "@/lib/prisma";

type DashboardMetrics = {
    totalSkus: string;
    inventoryValue: string;
    equipmentAvailability: string;
    maintenanceLoad: string;
};

export type DashboardInventoryOverviewItem = {
    id: string;
    name: string;
    sku: string;
    category: string;
    stockQty: number;
    status: "In Stock" | "Low Stock" | "Out of Stock";
    lastUpdated: string;
};

type FetchDashboardMetricsResult =
    | {
        ok: true;
        metrics: DashboardMetrics;
    }
    | {
        ok: false;
        message: string;
    };

type FetchDashboardInventoryOverviewResult =
    | {
        ok: true;
        items: DashboardInventoryOverviewItem[];
    }
    | {
        ok: false;
        message: string;
    };

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
}

function formatRelativeTime(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const minuteMs = 60_000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;

    if (diffMs < hourMs) {
        const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
        return `${minutes}m ago`;
    }

    if (diffMs < dayMs) {
        const hours = Math.floor(diffMs / hourMs);
        return `${hours}h ago`;
    }

    const days = Math.floor(diffMs / dayMs);
    return `${days}d ago`;
}

function formatEquipmentType(type: string): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
}

function mapStatusLabel(status: "AVAILABLE" | "MAINTENANCE" | "RETIRED" | "LOST"):
    "In Stock" | "Low Stock" | "Out of Stock" {
    if (status === "AVAILABLE") {
        return "In Stock";
    }

    if (status === "MAINTENANCE") {
        return "Low Stock";
    }

    return "Out of Stock";
}

export async function fetchDashboardMetricsAction(): Promise<FetchDashboardMetricsResult> {
    try {
        const equipment = await prisma.equipment.findMany({
            where: {
                deletedAt: null,
            },
            select: {
                sku: true,
                status: true,
                equipmentModel: {
                    select: {
                        price: true,
                    },
                },
            },
        });

        const uniqueSkus = new Set(
            equipment
                .map((item) => item.sku?.trim())
                .filter((sku): sku is string => Boolean(sku)),
        );

        const totalEquipment = equipment.length;
        const availableCount = equipment.filter((item) => item.status === "AVAILABLE").length;
        const maintenanceCount = equipment.filter((item) => item.status === "MAINTENANCE").length;

        const inventoryValue = equipment.reduce((sum, item) => {
            const price = item.equipmentModel.price;
            return sum + (price ? Number(price) : 0);
        }, 0);

        const availabilityRate = totalEquipment > 0 ? (availableCount / totalEquipment) * 100 : 0;
        const maintenanceRate = totalEquipment > 0 ? (maintenanceCount / totalEquipment) * 100 : 0;

        return {
            ok: true,
            metrics: {
                totalSkus: new Intl.NumberFormat("en-US").format(uniqueSkus.size),
                inventoryValue: formatCurrency(inventoryValue),
                equipmentAvailability: formatPercent(availabilityRate),
                maintenanceLoad: formatPercent(maintenanceRate),
            },
        };
    } catch (error) {
        console.error("[Dashboard Action] Failed to fetch metrics", {
            error: error instanceof Error ? error.message : "Unknown error",
        });

        return {
            ok: false,
            message: "Unable to load dashboard metrics right now.",
        };
    }
}

export async function fetchDashboardInventoryOverviewAction(): Promise<FetchDashboardInventoryOverviewResult> {
    try {
        const [latestEquipment, equipmentForCounts] = await Promise.all([
            prisma.equipment.findMany({
                where: {
                    deletedAt: null,
                },
                select: {
                    id: true,
                    sku: true,
                    status: true,
                    updatedAt: true,
                    equipmentModelId: true,
                    equipmentModel: {
                        select: {
                            name: true,
                            type: true,
                        },
                    },
                },
                orderBy: {
                    updatedAt: "desc",
                },
                take: 8,
            }),
            prisma.equipment.findMany({
                where: {
                    deletedAt: null,
                },
                select: {
                    equipmentModelId: true,
                },
            }),
        ]);

        const stockByModel = equipmentForCounts.reduce((acc, item) => {
            acc.set(item.equipmentModelId, (acc.get(item.equipmentModelId) ?? 0) + 1);
            return acc;
        }, new Map<string, number>());

        const items: DashboardInventoryOverviewItem[] = latestEquipment.map((item) => ({
            id: item.id,
            name: item.equipmentModel.name,
            sku: item.sku ?? "—",
            category: formatEquipmentType(item.equipmentModel.type),
            stockQty: stockByModel.get(item.equipmentModelId) ?? 1,
            status: mapStatusLabel(item.status),
            lastUpdated: formatRelativeTime(item.updatedAt),
        }));

        return {
            ok: true,
            items,
        };
    } catch (error) {
        console.error("[Dashboard Action] Failed to fetch inventory overview", {
            error: error instanceof Error ? error.message : "Unknown error",
        });

        return {
            ok: false,
            message: "Unable to load inventory overview right now.",
        };
    }
}
