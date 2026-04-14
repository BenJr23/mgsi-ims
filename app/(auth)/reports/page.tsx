import React, { Suspense, lazy } from 'react';

import { fetchReportsDashboardAction } from '@/app/_actions/reports';

export const metadata = {
	title: 'Reports and Analytics | MGSI - Inventory Management System',
	description: 'View and analyze reports and analytics for your inventory management.',
};

const ReportsView = lazy(async () => {
  const imported = await import('./reports-view');
  return { default: imported.ReportsView };
});

function ReportsViewSkeleton() {
  return (
    <div className="flex flex-col min-h-screen animate-pulse" aria-hidden="true">
      <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="h-8 w-56 rounded bg-stone-200" />
            <div className="mt-2 h-4 w-72 rounded bg-stone-200" />
          </div>
          <div className="h-10 w-36 rounded-lg bg-stone-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`kpi-skeleton-${index}`} className="bg-white p-5 rounded-xl border border-stone-200">
              <div className="h-3 w-28 rounded bg-stone-200" />
              <div className="mt-3 h-8 w-24 rounded bg-stone-200" />
              <div className="mt-3 h-3 w-20 rounded bg-stone-200" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-stone-200">
            <div className="h-5 w-44 rounded bg-stone-200" />
            <div className="mt-6 h-72 rounded-xl bg-stone-100" />
          </div>
          <div className="bg-white p-6 rounded-xl border border-stone-200">
            <div className="h-5 w-40 rounded bg-stone-200" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={`cat-skeleton-${index}`}>
                  <div className="h-3 w-24 rounded bg-stone-200" />
                  <div className="mt-2 h-2 w-full rounded bg-stone-100" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-200">
          <div className="h-5 w-40 rounded bg-stone-200" />
          <div className="mt-6 h-64 rounded-xl bg-stone-100" />
        </div>
      </main>
    </div>
  );
}

export default async function ReportsPage() {
  return <ReportsContent />;
}

async function ReportsContent() {
  const result = await fetchReportsDashboardAction();

  if (!result.ok) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 p-8 max-w-400 mx-auto w-full">
          <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
            <h1 className="text-base font-semibold">Reports unavailable</h1>
            <p className="mt-1 text-sm">{result.message}</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <Suspense fallback={<ReportsViewSkeleton />}>
      <ReportsView data={result.data} />
    </Suspense>
  );
}