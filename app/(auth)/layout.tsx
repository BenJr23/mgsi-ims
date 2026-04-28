import { redirect } from 'next/navigation';

import { AuthShell } from './components/AuthShell';
import { getSession } from '@/lib/get-session';

type AuthLayoutProps = {
	children: React.ReactNode;
};

export default async function AuthLayout({ children }: AuthLayoutProps) {
	const session = await getSession();

	if (!session) {
		redirect('/sign-in');
	}

	return (
		<div className="flex h-screen overflow-hidden bg-stone-50 font-sans selection:bg-amber-200 selection:text-amber-900">
			<AuthShell userName={session.user.name}>{children}</AuthShell>
		</div>
	);
}
