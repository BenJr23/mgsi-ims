import React, { Suspense, lazy } from 'react';

const UserManagementContent = lazy(async () => {
  const imported = await import('../components/UserManagementContent');
  return { default: imported.UserManagementContent };
});

function UserManagementSkeleton() {
  return (
    <div className="flex flex-col min-h-screen" aria-hidden="true">
      <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full">
        <div className="flex items-center justify-between gap-4 animate-pulse">
          <div>
            <div className="h-8 w-56 rounded bg-stone-200" />
            <div className="mt-2 h-4 w-64 rounded bg-stone-200" />
          </div>
          <div className="h-10 w-72 rounded bg-stone-200" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`user-metric-skeleton-${index}`} className="bg-white rounded-xl p-5 border border-stone-200 animate-pulse">
              <div className="h-4 w-28 rounded bg-stone-200" />
              <div className="mt-3 h-7 w-16 rounded bg-stone-200" />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={`user-row-skeleton-${index}`} className="h-10 rounded bg-stone-100 animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={<UserManagementSkeleton />}>
      <UserManagementContent />
    </Suspense>
  );
}