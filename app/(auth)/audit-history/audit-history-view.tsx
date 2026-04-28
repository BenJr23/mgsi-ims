"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { createAuditSessionAction } from "@/app/_actions/audit-history";
import type { AuditSessionWithItems } from "@/app/_actions/audit-history";
import { AuditSessionCard } from "@/app/(auth)/components/AuditSessionCard";

type AuditHistoryViewProps = {
    initialSessions: AuditSessionWithItems[];
};

export function AuditHistoryView({
    initialSessions,
}: AuditHistoryViewProps) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [sessions, setSessions] = useState(initialSessions);

    const handleStartAuditSession = async () => {
        setIsCreating(true);
        try {
            const result = await createAuditSessionAction();
            if (result.ok) {
                router.push(`/audit-history/new-session?sessionId=${result.sessionId}`);
            }
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-stone-900 mb-2">
                    Audit History
                </h1>
                <p className="text-stone-600">
                    Start a new audit session or view previous ones
                </p>
            </div>

            {/* Start Audit Session CTA */}
            <button
                onClick={handleStartAuditSession}
                disabled={isCreating}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <PlusIcon className="w-5 h-5" />
                {isCreating ? "Starting..." : "Start Audit Session"}
            </button>

            {/* Sessions List */}
            <div>
                <h2 className="text-xl font-semibold text-stone-900 mb-4">
                    Audit Session Details
                </h2>
                {sessions.length === 0 ? (
                    <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200">
                        <p className="text-stone-600 font-medium mb-1">No audit sessions yet</p>
                        <p className="text-stone-500 text-sm">
                            Start a new audit session to begin tracking inventory.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {sessions.map((session) => (
                            <AuditSessionCard key={session.id} session={session} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
