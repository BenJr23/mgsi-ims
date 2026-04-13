"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
    ArrowDownRightIcon,
    ArrowUpRightIcon,
    BarChart3Icon,
    CircleDollarSignIcon,
    Clock3Icon,
    RefreshCwIcon,
    ShieldCheckIcon,
    WrenchIcon,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import {
    fetchReportsDashboardAction,
    type ReportsDashboardData,
    type ReportsPeriod,
} from '@/app/_actions/reports';

type ReportsViewProps = {
    data: ReportsDashboardData;
};

type ReportsCache = Partial<Record<ReportsPeriod, ReportsDashboardData>>;

const PERIOD_OPTIONS: Array<{ label: string; value: ReportsPeriod }> = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
];

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
}

function formatRelativeTime(iso: string): string {
    const timestamp = new Date(iso).getTime();
    const diffMs = Date.now() - timestamp;
    const minutes = Math.max(1, Math.floor(diffMs / 60000));

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }

    return `${Math.floor(hours / 24)}d ago`;
}

export function ReportsView({ data }: ReportsViewProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<ReportsPeriod>(data.selectedPeriod);
    const [reportData, setReportData] = useState<ReportsDashboardData>(data);
    const [isUpdatingPeriod, setIsUpdatingPeriod] = useState(false);
    const [cachedByPeriod, setCachedByPeriod] = useState<ReportsCache>({
        [data.selectedPeriod]: data,
    });

    const fetchForPeriod = useCallback(
        async (period: ReportsPeriod, forceRefresh = false) => {
            if (!forceRefresh) {
                const cached = cachedByPeriod[period];
                if (cached) {
                    setReportData((previous) => (previous === cached ? previous : cached));
                    return;
                }
            }

            setIsUpdatingPeriod(true);
            const result = await fetchReportsDashboardAction(period);

            if (result.ok) {
                setCachedByPeriod((prev) => ({
                    ...prev,
                    [period]: result.data,
                }));
                setReportData(result.data);
            }

            setIsUpdatingPeriod(false);
        },
        [cachedByPeriod],
    );

    useEffect(() => {
        let isMounted = true;

        async function loadPeriodData() {
            if (!isMounted) {
                return;
            }

            await fetchForPeriod(selectedPeriod);
        }

        void loadPeriodData();

        return () => {
            isMounted = false;
        };
    }, [fetchForPeriod, selectedPeriod]);

    const monthlyTrendData = reportData.monthlyTrend.map((point) => ({
        month: point.label,
        equipmentAdded: point.equipmentAdded,
    }));

    const statusData = reportData.statusBreakdown.map((item) => ({
        status: item.label,
        count: item.count,
    }));

    const kpiCards = useMemo(
        () => [
            {
                label: 'Total Equipment',
                value: reportData.kpis.totalEquipment.toLocaleString(),
                trend: reportData.kpis.monthOverMonthGrowth,
                icon: BarChart3Icon,
                accent: 'bg-sky-50 text-sky-700 border-sky-100',
            },
            {
                label: 'Availability Rate',
                value: formatPercent(reportData.kpis.availabilityRate),
                trend: reportData.kpis.monthOverMonthGrowth,
                icon: ShieldCheckIcon,
                accent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            },
            {
                label: 'Maintenance Load',
                value: formatPercent(reportData.kpis.maintenanceRate),
                trend: -reportData.kpis.maintenanceRate / 4,
                icon: WrenchIcon,
                accent: 'bg-amber-50 text-amber-700 border-amber-100',
            },
            {
                label: 'Inventory Value',
                value: formatCurrency(reportData.kpis.totalInventoryValue),
                trend: reportData.kpis.monthOverMonthGrowth / 2,
                icon: CircleDollarSignIcon,
                accent: 'bg-violet-50 text-violet-700 border-violet-100',
            },
        ],
        [reportData],
    );

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Reports & Analytics</h1>
                        <p className="text-sm text-stone-500 mt-1">
                            Live operational intelligence for better stocking, maintenance, and budgeting decisions.
                        </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                        <div className="inline-flex items-center gap-2">
                            <div className="inline-flex items-center rounded-lg border border-stone-300 bg-white p-1">
                                {PERIOD_OPTIONS.map((option) => {
                                    const isActive = selectedPeriod === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setSelectedPeriod(option.value)}
                                            disabled={isUpdatingPeriod}
                                            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${isActive
                                                    ? 'bg-stone-900 text-white'
                                                    : 'text-stone-600 hover:bg-stone-100'
                                                } disabled:cursor-not-allowed disabled:opacity-70`}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={() => void fetchForPeriod(selectedPeriod, true)}
                                disabled={isUpdatingPeriod}
                                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <RefreshCwIcon
                                    className={`h-3.5 w-3.5 ${isUpdatingPeriod ? 'animate-spin' : ''}`}
                                    aria-hidden="true"
                                />
                                Refresh
                            </button>
                        </div>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {kpiCards.map((card) => {
                        const TrendIcon = card.trend >= 0 ? ArrowUpRightIcon : ArrowDownRightIcon;
                        const trendClass = card.trend >= 0 ? 'text-emerald-600' : 'text-rose-600';
                        const Icon = card.icon;

                        return (
                            <article key={card.label} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <p className="text-sm font-medium text-stone-500">{card.label}</p>
                                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${card.accent}`}>
                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                    </span>
                                </div>
                                <p className="mt-3 text-3xl font-bold tracking-tight text-stone-900">{card.value}</p>
                                <p className={`mt-3 inline-flex items-center text-xs font-semibold ${trendClass}`}>
                                    <TrendIcon className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                                    {Math.abs(card.trend).toFixed(1)}% vs previous month
                                </p>
                            </article>
                        );
                    })}
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <article className="xl:col-span-2 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-stone-900">Equipment Added Trend</h2>
                            <span className="text-xs font-medium text-stone-500">Line Chart</span>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyTrendData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="4 4" stroke="#e7e5e4" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fill: '#78716c', fontSize: 12 }}
                                        axisLine={{ stroke: '#d6d3d1' }}
                                        tickLine={{ stroke: '#d6d3d1' }}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: '#78716c', fontSize: 12 }}
                                        axisLine={{ stroke: '#d6d3d1' }}
                                        tickLine={{ stroke: '#d6d3d1' }}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: '#d6d3d1', strokeWidth: 1 }}
                                        contentStyle={{
                                            borderRadius: 10,
                                            borderColor: '#d6d3d1',
                                            fontSize: 12,
                                        }}
                                        labelStyle={{ color: '#000000' }}
                                        itemStyle={{ color: '#000000' }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="equipmentAdded"
                                        name="Equipment Added"
                                        stroke="#0f766e"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#0f766e' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </article>

                    <article className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-stone-900">Top Categories</h2>
                        <p className="text-xs text-stone-500 mt-1">By equipment volume</p>
                        <div className="mt-5 space-y-4">
                            {reportData.categoryBreakdown.map((item) => (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-stone-700">{item.label}</span>
                                        <span className="text-stone-500">{item.count} ({item.percent.toFixed(1)}%)</span>
                                    </div>
                                    <div className="mt-2 h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#fbbf24)]"
                                            style={{ width: `${item.percent}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>
                </section>

                <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-stone-900">Status Distribution</h2>
                        <span className="text-xs font-medium text-stone-500">Bar Chart</span>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="4 4" stroke="#e7e5e4" />
                                <XAxis
                                    dataKey="status"
                                    tick={{ fill: '#78716c', fontSize: 12 }}
                                    axisLine={{ stroke: '#d6d3d1' }}
                                    tickLine={{ stroke: '#d6d3d1' }}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fill: '#78716c', fontSize: 12 }}
                                    axisLine={{ stroke: '#d6d3d1' }}
                                    tickLine={{ stroke: '#d6d3d1' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f5f5f4' }}
                                    contentStyle={{
                                        borderRadius: 10,
                                        borderColor: '#d6d3d1',
                                        fontSize: 12,
                                    }}
                                    labelStyle={{ color: '#000000' }}
                                    itemStyle={{ color: '#000000' }}
                                />
                                <Legend />
                                <Bar dataKey="count" name="Equipment Count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </main>
        </div>
    );
}
