import React, { Suspense, lazy } from 'react';

export const metadata = {
	title: 'Dashboard | MGSI - Inventory Management System',
	description: 'Your dashboard for managing assets and inventory.',
};

const MetricsCards = lazy(async () => {
    const imported = await import('../components/MetricsCards');
    return { default: imported.MetricsCards };
});

const InventoryTable = lazy(async () => {
    const imported = await import('../components/InventoryTable');
    return { default: imported.InventoryTable };
});

function MetricsCardsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={`metric-skeleton-${index}`}
                    className="bg-white rounded-xl p-6 shadow-sm border border-stone-200 animate-pulse"
                >
                    <div className="h-4 w-24 rounded bg-stone-200" />
                    <div className="mt-3 h-7 w-20 rounded bg-stone-200" />
                </div>
            ))}
        </div>
    );
}

function InventoryTableSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200" aria-hidden="true">
            <div className="p-6 border-b border-stone-200 animate-pulse space-y-3">
                <div className="h-5 w-56 rounded bg-stone-200" />
                <div className="h-4 w-72 rounded bg-stone-200" />
            </div>
            <div className="p-6 space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={`row-skeleton-${index}`} className="h-10 rounded bg-stone-100 animate-pulse" />
                ))}
            </div>
        </div>
    );
}

export default function DashboardPage() {

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="flex flex-col min-h-full w-full">
            <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full">
                {/* Page Header */}
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-sm text-stone-500 mt-1">{today}</p>
                </div>

                {/* Metrics Section */}
                <section aria-label="Key Performance Indicators">
                    <Suspense fallback={<MetricsCardsSkeleton />}>
                        <MetricsCards />
                    </Suspense>
                </section>

                {/* Main Table Section */}
                <section aria-label="Inventory Data">
                    <Suspense fallback={<InventoryTableSkeleton />}>
                        <InventoryTable />
                    </Suspense>
                </section>
            </main>
        </div>);

}