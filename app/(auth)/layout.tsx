import { redirect } from 'next/navigation';

import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
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
			<Sidebar />
			<div className="flex h-screen flex-1 min-w-0 flex-col md:ml-64">
				<TopBar userName={session.user.name} />
				<div className="min-h-0 flex-1 overflow-y-auto pb-20 md:pb-0">{children}</div>
			</div>
		</div>
	);
}
