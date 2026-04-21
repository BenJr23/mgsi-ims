import React, { Suspense, lazy } from 'react';

import { fetchAuditLogsAction } from '@/app/_actions/audit-logs';

const AuditLogsView = lazy(async () => {
    const imported = await import('./audit-logs-view');
    return { default: imported.AuditLogsView };
});

export const metadata = {
    title: 'Audit Logs | MGSI - Inventory Management System',
    description: 'Review user activities, security events, and system actions.',
};

function AuditLogsSkeleton() {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full" aria-hidden="true">
                <div className="space-y-2 animate-pulse">
                    <div className="h-8 w-48 rounded bg-stone-200" />
                    <div className="h-4 w-96 rounded bg-stone-200" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={`audit-metric-skeleton-${index}`}
                            className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm animate-pulse"
                        >
                            <div className="h-4 w-28 rounded bg-stone-200" />
                            <div className="mt-3 h-7 w-20 rounded bg-stone-200" />
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 animate-pulse">
                    <div className="h-10 w-full rounded bg-stone-100" />
                </div>

                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden animate-pulse">
                    <div className="h-12 border-b border-stone-200 bg-stone-100" />
                    <div className="p-4 space-y-3">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={`audit-row-skeleton-${index}`} className="h-10 rounded bg-stone-100" />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default async function AuditLogsPage() {
    const result = await fetchAuditLogsAction();

    if (!result.ok) {
        return (
            <div className="flex flex-col min-h-screen">
                <main className="flex-1 p-8 max-w-400 mx-auto w-full">
                    <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
                        <h1 className="text-base font-semibold">Audit logs unavailable</h1>
                        <p className="mt-1 text-sm">{result.message}</p>
                    </section>
                </main>
            </div>
        );
    }

    return (
        <Suspense fallback={<AuditLogsSkeleton />}>
            <AuditLogsView initialLogs={result.logs} />
        </Suspense>
    );
}