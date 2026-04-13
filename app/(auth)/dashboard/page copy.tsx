import { Suspense } from 'react';
import { getSession } from '@/lib/get-session';

export const metadata = {
	title: 'Home | MGSI - Booking Management System',
	description: 'Your dashboard for managing bookings and availability.',
};

async function Greeting() {
	const session = await getSession();
	const displayName = session?.user.name.split(' ')[0] || 'User';
	return <>{displayName}</>;
}

export default function Dashboard() {
	return (
		<div className="px-6 py-8 lg:px-12 lg:py-10">
			<div className="mx-auto max-w-350">
				<div className="mb-6">
					<h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-900 lg:text-4xl">
						Welcome back, <Suspense fallback={<div className="h-6 rounded-md bg-muted"/>}><Greeting /></Suspense>
					</h1>
					<p className="mt-2 text-sm text-gray-600 lg:text-base">
						Plan your day with your active bookings and availability.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
					<section className="h-full lg:col-span-8">
						{/* <TripStyleSlider /> */}
					</section>

					<aside className="space-y-4 lg:col-span-4">
						<Suspense fallback={<div className="h-32 rounded-md bg-muted" />}>
							{/* <BookingRectangles /> */}
						</Suspense>
						<Suspense fallback={<div className="h-64 rounded-md bg-muted" />}>
							{/* <MiniCalendarCard /> */}
						</Suspense>
					</aside>
				</div>
			</div>
		</div>
	);
}
