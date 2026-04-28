import React from "react";
import { getAuditSessionsAction } from "@/app/_actions/audit-history";
import { AuditHistoryView } from "./audit-history-view";

export const metadata = {
    title: "Audit History | IMS",
    description: "View and manage audit sessions",
};

export default async function AuditHistoryPage() {
    const result = await getAuditSessionsAction();

    const sessions = result.ok ? result.sessions : [];

    return (
        <main className="flex-1 p-8 space-y-8 max-w-4xl mx-auto w-full">
            <AuditHistoryView initialSessions={sessions} />
        </main>
    );
}
