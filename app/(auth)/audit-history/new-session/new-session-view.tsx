"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, StopCircleIcon, AlertCircleIcon } from "lucide-react";
import {
    getAuditSessionDetailAction,
    addAuditItemAction,
    completeAuditSessionAction,
    cancelAuditSessionAction,
} from "@/app/_actions/audit-history";
import { ScannerModal } from "@/app/(auth)/components/ScannerModal";
import { AuditItemList } from "@/app/(auth)/components/AuditItemList";
import type { AuditSessionItemDetail } from "@/app/_actions/audit-history";
import type { AuditItemStatus } from "@/app/generated/prisma/enums";

type NewSessionViewProps = {
    sessionId: string;
};

export function NewSessionView({ sessionId }: NewSessionViewProps) {
    const router = useRouter();
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [items, setItems] = useState<AuditSessionItemDetail[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sessionStatus, setSessionStatus] = useState<"IN_PROGRESS" | "COMPLETED" | "CANCELLED">("IN_PROGRESS");

    // Fetch session details on mount
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const result = await getAuditSessionDetailAction(sessionId);
                if (result.ok) {
                    setItems(result.session.items);
                    setSessionStatus(result.session.status);
                } else {
                    setError(result.message);
                }
            } catch (err) {
                setError("Failed to load session");
                console.error(err);
            } finally {
                setIsFetching(false);
            }
        };

        fetchSession();
    }, [sessionId]);

    const handleAddItem = async (
        qrCode: string,
        status: AuditItemStatus,
        notes?: string
    ) => {
        setIsLoading(true);
        try {
            // In a real app, you'd need to look up equipment by QR code first
            // For now, we'll use the QR code as the equipment ID or search for it
            const result = await addAuditItemAction(
                sessionId,
                qrCode, // This should be equipmentId, but we'll need to search for it
                status,
                notes
            );

            if (result.ok) {
                // Refresh the session details
                const sessionResult = await getAuditSessionDetailAction(sessionId);
                if (sessionResult.ok) {
                    setItems(sessionResult.session.items);
                }
                setIsScannerOpen(false);
            } else {
                setError(result.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteSession = async () => {
        if (
            !confirm(
                `Complete this audit session with ${items.length} items scanned?`
            )
        ) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await completeAuditSessionAction(sessionId);
            if (result.ok) {
                router.push(`/audit-history/${sessionId}`);
            } else {
                setError(result.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelSession = async () => {
        if (
            !confirm("Are you sure you want to cancel this audit session?")
        ) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await cancelAuditSessionAction(sessionId);
            if (result.ok) {
                router.push("/audit-history");
            } else {
                setError(result.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <main className="flex-1 p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-stone-600">Loading session...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 p-8 space-y-8 max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-stone-100 rounded-lg transition"
                        aria-label="Go back"
                    >
                        <ChevronLeftIcon className="w-6 h-6 text-stone-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900">New Audit Session</h1>
                        <p className="text-stone-600">
                            {items.length} item{items.length !== 1 ? "s" : ""} scanned
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-rose-800 font-medium">Error</p>
                        <p className="text-rose-700 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-3 flex-wrap">
                <button
                    onClick={() => setIsScannerOpen(true)}
                    disabled={isLoading || sessionStatus !== "IN_PROGRESS"}
                    className="flex-1 min-w-50 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    📱 Scan Item
                </button>
                <button
                    onClick={handleCompleteSession}
                    disabled={isLoading || sessionStatus !== "IN_PROGRESS" || items.length === 0}
                    className="flex-1 min-w-50 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ✓ Stop Audit Session
                </button>
                <button
                    onClick={handleCancelSession}
                    disabled={isLoading || sessionStatus !== "IN_PROGRESS"}
                    className="flex-1 min-w-50 bg-stone-600 hover:bg-stone-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <StopCircleIcon className="w-4 h-4" />
                    Cancel
                </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900 text-sm">
                    <span className="font-semibold">Instructions:</span> Press &quot;Scan Item&quot;
                    → Scan QR → Change status if needed → Select &quot;Add Another&quot; to scan more
                    items or &quot;Save&quot; to move to the next item → Press &quot;Stop Audit Session&quot;
                    when complete.
                </p>
            </div>

            {/* Added Items List */}
            <div>
                <h2 className="text-xl font-semibold text-stone-900 mb-4">
                    Scanned Items
                </h2>
                <AuditItemList items={items} sessionId={sessionId} />
            </div>

            {/* Scanner Modal */}
            <ScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onSave={(qrCode, status, notes) => {
                    handleAddItem(qrCode, status, notes);
                }}
                onAddAnother={(qrCode, status, notes) => {
                    handleAddItem(qrCode, status, notes);
                    // Keep modal open for another scan
                    setIsScannerOpen(true);
                }}
                isLoading={isLoading}
            />
        </main>
    );
}
