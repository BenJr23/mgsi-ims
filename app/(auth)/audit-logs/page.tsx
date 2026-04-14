import { fetchAuditLogsAction } from '@/app/_actions/audit-logs';

import { AuditLogsView } from './audit-logs-view';

export const metadata = {
    title: 'Audit Logs | MGSI - Inventory Management System',
    description: 'Review user activities, security events, and system actions.',
};

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

    return <AuditLogsView initialLogs={result.logs} />;
}