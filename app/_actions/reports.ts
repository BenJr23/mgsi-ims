"use server";

import { prisma } from '@/lib/prisma';

export type ReportsPeriod = 'today' | 'week' | 'month' | 'year';

export type ReportsKpi = {
    totalEquipment: number;
    availableEquipment: number;
    maintenanceEquipment: number;
    retiredOrLostEquipment: number;
    totalInventoryValue: number;
    availabilityRate: number;
    maintenanceRate: number;
    monthOverMonthGrowth: number;
};

export type ReportsMonthlyPoint = {
    key: string;
    label: string;
    equipmentAdded: number;
};

export type ReportsCategoryPoint = {
    label: string;
    count: number;
    percent: number;
};

export type ReportsStatusPoint = {
    label: string;
    count: number;
};

export type ReportsDashboardData = {
    selectedPeriod: ReportsPeriod;
    generatedAt: string;
    kpis: ReportsKpi;
    monthlyTrend: ReportsMonthlyPoint[];
    categoryBreakdown: ReportsCategoryPoint[];
    statusBreakdown: ReportsStatusPoint[];
};

type FetchReportsDashboardResult =
    | {
        ok: true;
        data: ReportsDashboardData;
    }
    | {
        ok: false;
        message: string;
    };

function getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatHourLabel(date: Date): string {
    const label = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: true,
    }).format(date);

    return label.replace(' ', '');
}

function getTrendBuckets(period: ReportsPeriod, now: Date): Array<{ key: string; label: string; start: Date; end: Date }> {
    if (period === 'today') {
        const dayStart = startOfDay(now);
        return Array.from({ length: 24 }).map((_, hour) => {
            const start = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), hour, 0, 0, 0);
            const end = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), hour + 1, 0, 0, 0);

            return {
                key: `${getMonthKey(start)}-${String(start.getDate()).padStart(2, '0')}-${String(hour).padStart(2, '0')}`,
                label: formatHourLabel(start),
                start,
                end,
            };
        });
    }

    if (period === 'week') {
        const todayStart = startOfDay(now);
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 6);

        return Array.from({ length: 7 }).map((_, index) => {
            const start = new Date(weekStart);
            start.setDate(start.getDate() + index);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);

            return {
                key: `${getMonthKey(start)}-${String(start.getDate()).padStart(2, '0')}`,
                label: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(start),
                start,
                end,
            };
        });
    }

    if (period === 'year') {
        const yearStart = new Date(now.getFullYear(), 0, 1);

        return Array.from({ length: 12 }).map((_, month) => {
            const start = new Date(yearStart.getFullYear(), month, 1);
            const end = new Date(yearStart.getFullYear(), month + 1, 1);

            return {
                key: getMonthKey(start),
                label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(start),
                start,
                end,
            };
        });
    }

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentDay = now.getDate();

    return Array.from({ length: currentDay }).map((_, index) => {
        const day = index + 1;
        const start = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
        const end = new Date(monthStart.getFullYear(), monthStart.getMonth(), day + 1);

        return {
            key: `${getMonthKey(start)}-${String(day).padStart(2, '0')}`,
            label: String(day),
            start,
            end,
        };
    });
}

function toPercent(part: number, total: number): number {
    if (total <= 0) {
        return 0;
    }

    return Number(((part / total) * 100).toFixed(1));
}

export async function fetchReportsDashboardAction(period: ReportsPeriod = 'month'): Promise<FetchReportsDashboardResult> {
    try {
        const now = new Date();
        const buckets = getTrendBuckets(period, now);
        const periodStart = buckets.length > 0 ? buckets[0].start : startOfDay(now);

        const equipment = await prisma.equipment.findMany({
            where: {
                deletedAt: null,
            },
            select: {
                status: true,
                createdAt: true,
                equipmentModel: {
                    select: {
                        type: true,
                        price: true,
                    },
                },
            },
        });

        const equipmentInPeriod = equipment.filter((item) => item.createdAt >= periodStart && item.createdAt <= now);

        const totalEquipment = equipmentInPeriod.length;
        const availableEquipment = equipmentInPeriod.filter((item) => item.status === 'AVAILABLE').length;
        const maintenanceEquipment = equipmentInPeriod.filter((item) => item.status === 'MAINTENANCE').length;
        const retiredOrLostEquipment = equipmentInPeriod.filter(
            (item) => item.status === 'RETIRED' || item.status === 'LOST',
        ).length;

        const totalInventoryValue = equipmentInPeriod.reduce((sum, item) => {
            const rawPrice = item.equipmentModel.price;
            const numericPrice = rawPrice ? Number(rawPrice) : 0;
            return sum + (Number.isFinite(numericPrice) ? numericPrice : 0);
        }, 0);

        const windowDurationMs = Math.max(1, now.getTime() - periodStart.getTime() + 1);
        const previousStart = new Date(periodStart.getTime() - windowDurationMs);
        const previousEnd = periodStart;

        const currentCount = equipmentInPeriod.length;
        const previousCount = equipment.filter(
            (item) => item.createdAt >= previousStart && item.createdAt < previousEnd,
        ).length;

        const monthOverMonthGrowth = previousCount === 0
            ? (currentCount > 0 ? 100 : 0)
            : Number((((currentCount - previousCount) / previousCount) * 100).toFixed(1));

        const categoryCounts = new Map<string, number>();
        for (const item of equipmentInPeriod) {
            const label = item.equipmentModel.type;
            categoryCounts.set(label, (categoryCounts.get(label) ?? 0) + 1);
        }

        const categoryBreakdown = Array.from(categoryCounts.entries())
            .map(([label, count]) => ({
                label,
                count,
                percent: toPercent(count, totalEquipment),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        const statusBreakdown: ReportsStatusPoint[] = [
            { label: 'Available', count: availableEquipment },
            { label: 'Maintenance', count: maintenanceEquipment },
            {
                label: 'Retired',
                count: equipmentInPeriod.filter((item) => item.status === 'RETIRED').length,
            },
            {
                label: 'Lost',
                count: equipmentInPeriod.filter((item) => item.status === 'LOST').length,
            },
        ];

        const monthlyTrend: ReportsMonthlyPoint[] = buckets.map((bucket) => ({
            key: bucket.key,
            label: bucket.label,
            equipmentAdded: equipment.filter(
                (item) => item.createdAt >= bucket.start && item.createdAt < bucket.end,
            ).length,
        }));

        return {
            ok: true,
            data: {
                selectedPeriod: period,
                generatedAt: now.toISOString(),
                kpis: {
                    totalEquipment,
                    availableEquipment,
                    maintenanceEquipment,
                    retiredOrLostEquipment,
                    totalInventoryValue,
                    availabilityRate: toPercent(availableEquipment, totalEquipment),
                    maintenanceRate: toPercent(maintenanceEquipment, totalEquipment),
                    monthOverMonthGrowth,
                },
                monthlyTrend,
                categoryBreakdown,
                statusBreakdown,
            },
        };
    } catch (error) {
        console.error('[Reports Action] Failed to fetch reports dashboard', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
            ok: false,
            message: 'Unable to load reports right now.',
        };
    }
}
