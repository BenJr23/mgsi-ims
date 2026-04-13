import { redirect } from 'next/navigation';

import { getSession } from '@/lib/get-session';

export default async function Page() {
  const session = await getSession();

  redirect(session ? '/dashboard' : '/sign-in');
}