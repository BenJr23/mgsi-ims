import React, { Suspense, lazy } from 'react';

const EquipmentModelsContent = lazy(() => import('./EquipmentModelsContent'));

function EquipmentModelsSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full" aria-hidden="true">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-56 rounded bg-stone-200 animate-pulse" />
            <div className="h-4 w-72 rounded bg-stone-200 animate-pulse" />
          </div>
          <div className="h-10 w-32 rounded-lg bg-stone-200 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`equipment-model-metric-${index}`}
              className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 animate-pulse"
            >
              <div className="h-4 w-24 rounded bg-stone-200" />
              <div className="mt-3 h-6 w-20 rounded bg-stone-200" />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-stone-200 space-y-3">
            <div className="h-4 w-48 rounded bg-stone-200 animate-pulse" />
            <div className="h-4 w-64 rounded bg-stone-100 animate-pulse" />
          </div>
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`equipment-model-row-${index}`} className="h-10 rounded bg-stone-100 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EquipmentModelsPage() {
  return (
    <Suspense fallback={<EquipmentModelsSkeleton />}>
      <EquipmentModelsContent />
    </Suspense>
  );
}