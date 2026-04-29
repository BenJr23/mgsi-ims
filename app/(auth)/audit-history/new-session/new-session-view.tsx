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
import { fetchBranchesAction, type BranchItem } from "@/app/_actions/branches";
import { ScannerModal } from "@/app/(auth)/components/ScannerModal";
import { AuditItemList } from "@/app/(auth)/components/AuditItemList";
import type { AuditSessionItemDetail } from "@/app/_actions/audit-history";

type NewSessionViewProps = {
    sessionId: string;
};

export function NewSessionView({ sessionId }: NewSessionViewProps) {
    const router = useRouter();
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [items, setItems] = useState<AuditSessionItemDetail[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isLoadingBranches, setIsLoadingBranches] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sessionStatus, setSessionStatus] = useState<"IN_PROGRESS" | "COMPLETED" | "CANCELLED">("IN_PROGRESS");
    const [branches, setBranches] = useState<BranchItem[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [selectedAreaId, setSelectedAreaId] = useState("");

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

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const result = await fetchBranchesAction();
                if (result.ok) {
                    setBranches(result.branches);

                    const initialBranch = result.branches[0];
                    const initialArea = initialBranch?.areas?.[0];

                    setSelectedBranchId(initialBranch?.id ?? "");
                    setSelectedAreaId(initialArea?.id ?? "");
                } else {
                    setError(result.message);
                    setBranches([]);
                }
            } catch (err) {
                setError("Failed to load branches and areas");
                console.error(err);
            } finally {
                setIsLoadingBranches(false);
            }
        };

        fetchBranches();
    }, []);

    const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? null;
    const selectedAreas = selectedBranch?.areas ?? [];
    const selectedArea = selectedAreas.find((area) => area.id === selectedAreaId) ?? selectedAreas[0] ?? null;
    const selectedEquipmentTotal = selectedArea?.equipCount ?? selectedBranch?.equipCount ?? 0;
    const canStartScanning = Boolean(selectedBranch && selectedArea);

    useEffect(() => {
        if (!selectedBranch) {
            setSelectedAreaId("");
            return;
        }

        const areaStillExists = selectedAreas.some((area) => area.id === selectedAreaId);
        if (!areaStillExists) {
            setSelectedAreaId(selectedAreas[0]?.id ?? "");
        }
    }, [selectedBranch, selectedAreaId, selectedAreas]);

    const handleAddItem = async (
        equipmentId: string,
        status: "PASS" | "FAIL" | "MISSING",
        notes?: string,
        keepScannerOpen = false
    ) => {
        setIsLoading(true);
        try {
            const result = await addAuditItemAction(
                sessionId,
                equipmentId,
                status,
                notes
            );

            if (result.ok) {
                // Refresh the session details
                const sessionResult = await getAuditSessionDetailAction(sessionId);
                if (sessionResult.ok) {
                    setItems(sessionResult.session.items);
                }
                if (!keepScannerOpen) {
                    setIsScannerOpen(false);
                }
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
                    disabled={isLoading || isLoadingBranches || sessionStatus !== "IN_PROGRESS" || !canStartScanning}
                    className="flex-1 min-w-50 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoadingBranches ? "Loading Branches..." : "📱 Start Scanning"}
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

            {/* Branch / Area Selector */}
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5 space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-stone-900">Session Location</h2>
                    <p className="text-sm text-stone-600">
                        Choose the branch and area before scanning. The selected area count is used as the scan target.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                        <span className="block text-sm font-medium text-stone-700">Branch</span>
                        <select
                            value={selectedBranchId}
                            onChange={(event) => {
                                const branchId = event.target.value;
                                const nextBranch = branches.find((branch) => branch.id === branchId) ?? null;
                                setSelectedBranchId(branchId);
                                setSelectedAreaId(nextBranch?.areas?.[0]?.id ?? "");
                            }}
                            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            disabled={isLoadingBranches || branches.length === 0}
                        >
                            <option value="">Select a branch</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-2">
                        <span className="block text-sm font-medium text-stone-700">Area</span>
                        <select
                            value={selectedAreaId}
                            onChange={(event) => setSelectedAreaId(event.target.value)}
                            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            disabled={isLoadingBranches || selectedAreas.length === 0}
                        >
                            <option value="">Select an area</option>
                            {selectedAreas.map((area) => (
                                <option key={area.id} value={area.id}>
                                    {area.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg bg-stone-50 border border-stone-200 p-4">
                        <p className="text-xs uppercase tracking-wide text-stone-500 mb-1">Selected Branch</p>
                        <p className="font-semibold text-stone-900">{selectedBranch?.name ?? "None selected"}</p>
                    </div>
                    <div className="rounded-lg bg-stone-50 border border-stone-200 p-4">
                        <p className="text-xs uppercase tracking-wide text-stone-500 mb-1">Selected Area</p>
                        <p className="font-semibold text-stone-900">{selectedArea?.name ?? "None selected"}</p>
                    </div>
                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                        <p className="text-xs uppercase tracking-wide text-yellow-700 mb-1">Equipment Total</p>
                        <p className="font-semibold text-yellow-900">{selectedEquipmentTotal.toLocaleString()} items</p>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900 text-sm">
                    <span className="font-semibold">Instructions:</span> Pick the branch and area first, then press
                    &quot;Start Scanning&quot; → scan QR → choose Pass / Failed / Missing once and keep scanning with the
                    same status until you change it → use &quot;Add Another&quot; for continuous scanning or &quot;Save&quot; to
                    finish the current item.
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
                onSave={async (equipmentId, status, notes) => {
                    await handleAddItem(equipmentId, status, notes);
                }}
                onAddAnother={async (equipmentId, status, notes) => {
                    await handleAddItem(equipmentId, status, notes, true);
                }}
                isLoading={isLoading}
            />
        </main>
    );
}
