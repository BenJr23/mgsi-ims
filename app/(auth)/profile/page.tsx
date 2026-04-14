import React from 'react'
import { getProfilePageDataCached } from '@/app/_actions/profile'
import { ProfileView } from '@/app/(auth)/components/ProfileView'

export default async function ProfileRoutePage() {
  const result = await getProfilePageDataCached()
  const profileData = result.success ? result.data : undefined

  const fallbackRole: 'ADMIN' | 'MANAGER' | 'USER' = 'ADMIN'
  const fallbackName = 'Admin User'
  const fallbackEmail = 'admin@company.com'

  return (
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
  )
}
