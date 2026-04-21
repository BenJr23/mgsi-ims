import React, { Suspense, lazy } from 'react';

export const metadata = {
    title: 'Branches & Areas | MGSI - Inventory Management System',
    description: 'Manage branches, areas, and location structure across your inventory operations.',
};

const BranchesAreasView = lazy(async () => {
    const imported = await import('./branches-areas-view');
    return { default: imported.BranchesAreasView };
});

function BranchesAreasSkeleton() {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full" aria-hidden="true">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
                    <div className="space-y-2">
                        <div className="h-8 w-56 rounded bg-stone-200" />
                        <div className="h-4 w-80 rounded bg-stone-200" />
                    </div>
                    <div className="h-10 w-full sm:w-64 rounded-lg bg-stone-100" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={`branches-metric-skeleton-${index}`}
                            className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 animate-pulse"
                        >
                            <div className="h-4 w-24 rounded bg-stone-200" />
                            <div className="mt-3 h-7 w-20 rounded bg-stone-200" />
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={`branch-card-skeleton-${index}`}
                            className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden animate-pulse"
                        >
                            <div className="p-5 flex items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="h-5 w-48 rounded bg-stone-200" />
                                    <div className="h-4 w-64 rounded bg-stone-100" />
                                </div>
                                <div className="h-4 w-28 rounded bg-stone-100" />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

export default function BranchesAreasPage() {
    return (
        <Suspense fallback={<BranchesAreasSkeleton />}>
            <BranchesAreasView />
        </Suspense>
    );
}
