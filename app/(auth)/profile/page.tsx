import React, { Suspense, lazy } from 'react';

import { getProfilePageDataCached } from '@/app/_actions/profile';

export const metadata = {
  title: 'Profile | MGSI - Inventory Management System',
  description: 'View and manage your account details and profile activity.',
};

const ProfileView = lazy(async () => {
  const imported = await import('./ProfileView');
  return { default: imported.ProfileView };
});

function ProfilePageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full" aria-hidden="true">
        <div className="space-y-2 animate-pulse">
          <div className="h-8 w-40 rounded bg-stone-200" />
          <div className="h-4 w-80 rounded bg-stone-200" />
        </div>

        <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 sm:p-7 animate-pulse">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-stone-200" />
              <div className="space-y-2">
                <div className="h-3 w-28 rounded bg-stone-200" />
                <div className="h-7 w-56 rounded bg-stone-200" />
                <div className="h-4 w-64 rounded bg-stone-100" />
              </div>
            </div>
            <div className="h-7 w-24 rounded-full bg-stone-200" />
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <article
              key={`profile-info-skeleton-${index}`}
              className="bg-white rounded-xl border border-stone-200 shadow-sm px-4 py-4 animate-pulse"
            >
              <div className="h-3 w-20 rounded bg-stone-200" />
              <div className="mt-3 h-5 w-3/4 rounded bg-stone-100" />
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default async function ProfileRoutePage() {
  const result = await getProfilePageDataCached();
  const profileData = result.success ? result.data : undefined;

  const fallbackRole: 'ADMIN' | 'MANAGER' | 'USER' = 'ADMIN';
  const fallbackName = 'Admin User';
  const fallbackEmail = 'admin@company.com';

  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfileView
        userName={profileData?.name ?? fallbackName}
        userEmail={profileData?.email ?? fallbackEmail}
        userRole={profileData?.role ?? fallbackRole}
        userImage={profileData?.image ?? null}
        userPhone={profileData?.phoneNumber ?? ''}
        userCompanyId={profileData?.companyId ?? null}
        availableCompanies={[]}
        userCreatedAt={profileData?.createdAt ?? null}
        lastLogin={profileData?.lastLogin ?? null}
      />
    </Suspense>
  );
}
