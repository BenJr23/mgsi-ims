"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, AlertCircleIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { getAuditSessionItemDetailAction } from "@/app/_actions/audit-history";
import type { AuditSessionItemDetail } from "@/app/_actions/audit-history";

type ItemDetailViewProps = {
    sessionId: string;
    itemId: string;
};

function getStatusBadge(status: string) {
    switch (status) {
        case "PASS":
            return "bg-emerald-100 text-emerald-800 border-emerald-200";
        case "FAIL":
            return "bg-rose-100 text-rose-800 border-rose-200";
        case "MISSING":
            return "bg-amber-100 text-amber-800 border-amber-200";
        default:
            return "bg-stone-100 text-stone-800 border-stone-200";
    }
}

function getStatusIcon(status: string) {
    switch (status) {
        case "PASS":
            return <CheckCircleIcon className="w-6 h-6 text-emerald-600" />;
        case "FAIL":
            return <XCircleIcon className="w-6 h-6 text-rose-600" />;
        case "MISSING":
            return <AlertCircleIcon className="w-6 h-6 text-amber-600" />;
        default:
            return <CheckCircleIcon className="w-6 h-6 text-stone-600" />;
    }
}

function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
}

export function ItemDetailView({ sessionId, itemId }: ItemDetailViewProps) {
    const router = useRouter();
    const [item, setItem] = useState<AuditSessionItemDetail | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const result = await getAuditSessionItemDetailAction(itemId);
                if (result.ok) {
                    setItem(result.item);
                } else {
                    setError(result.message);
                }
            } catch (err) {
                setError("Failed to load item details");
                console.error(err);
            } finally {
                setIsFetching(false);
            }
        };

        fetchItem();
    }, [itemId]);

    if (isFetching) {
        return (
            <main className="flex-1 p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-stone-600">Loading item details...</p>
                </div>
            </main>
        );
    }

    if (!item) {
        return (
            <main className="flex-1 p-8 space-y-8 max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-stone-100 rounded-lg transition"
                        aria-label="Go back"
                    >
                        <ChevronLeftIcon className="w-6 h-6 text-stone-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-stone-900">Item Not Found</h1>
                </div>
                {error && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircleIcon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <p className="text-rose-800">{error}</p>
                    </div>
                )}
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
                    <h1 className="text-2xl font-bold text-stone-900">Item Details</h1>
                </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
                <div className="flex items-start gap-4">
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-stone-900 mb-2">
                            {item.equipment.equipmentModel.name}
                        </h2>
                        <div>
                            <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadge(item.status)}`}
                            >
                                {item.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Equipment Details */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold text-stone-900">Equipment Details</h3>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs text-stone-500 mb-1">Equipment Model</p>
                        <p className="text-sm font-semibold text-stone-900">
                            {item.equipment.equipmentModel.name}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-stone-500 mb-1">Type</p>
                        <p className="text-sm font-semibold text-stone-900">
                            {item.equipment.equipmentModel.type}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-stone-500 mb-1">SKU</p>
                        <p className="text-sm font-mono text-stone-900">
                            {item.equipment.sku || "N/A"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-stone-500 mb-1">QR Code</p>
                        <p className="text-sm font-mono text-stone-700 break-all">
                            {item.equipment.qrCode}
                        </p>
                    </div>
                </div>
            </div>

            {/* Audit Details */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold text-stone-900">Audit Details</h3>

                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-stone-500 mb-1">Scanned At</p>
                        <p className="text-sm font-semibold text-stone-900">
                            {formatDateTime(item.scannedAt)}
                        </p>
                    </div>

                    {item.notes && (
                        <div>
                            <p className="text-xs text-stone-500 mb-2">Notes</p>
                            <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
                                <p className="text-sm text-stone-700 whitespace-pre-wrap">
                                    {item.notes}
                                </p>
                            </div>
                        </div>
                    )}

                    <div>
                        <p className="text-xs text-stone-500 mb-1">Item ID</p>
                        <p className="text-sm font-mono text-stone-700">{item.id}</p>
                    </div>
                </div>
            </div>

            {/* Back Button */}
            <div className="flex gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex-1 px-4 py-3 border border-stone-200 text-stone-700 font-semibold rounded-lg hover:bg-stone-50 transition"
                >
                    Back to Session
                </button>
            </div>
        </main>
    );
}
