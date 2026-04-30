"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, StopCircleIcon, AlertCircleIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
    getAuditSessionDetailAction,
    addAuditItemAction,
    completeAuditSessionAction,
    cancelAuditSessionAction,
} from "../../../_actions/audit-history";
import { fetchBranchesAction, type BranchItem } from "@/app/_actions/branches";
import { fetchEquipmentAction } from "@/app/_actions/equipment";
import { ScannerModal } from "@/app/(auth)/components/ScannerModal";
import { AuditItemList } from "@/app/(auth)/components/AuditItemList";
import { AuditStatusSelectionModal } from "@/app/(auth)/components/modals/AuditStatusSelectionModal";
import type { AuditSessionItemDetail } from "../../../_actions/audit-history";
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
    const [isLoadingBranches, setIsLoadingBranches] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sessionStatus, setSessionStatus] = useState<"IN_PROGRESS" | "COMPLETED" | "CANCELLED">("IN_PROGRESS");
    const [branches, setBranches] = useState<BranchItem[]>([]);
    const [sessionBranchId, setSessionBranchId] = useState("");
    const [sessionAreaId, setSessionAreaId] = useState("");
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [selectedAreaId, setSelectedAreaId] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<AuditItemStatus>("AVAILABLE");
    const [isStatusSelectionOpen, setIsStatusSelectionOpen] = useState(false);
    const [remainingEquipmentIds, setRemainingEquipmentIds] = useState<string[]>([]);
    const [remainingItemCount, setRemainingItemCount] = useState(0);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [showCancelSuccessToast, setShowCancelSuccessToast] = useState(false);
    const cancelSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch session details on mount
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const result = await getAuditSessionDetailAction(sessionId);
                if (result.ok) {
                    setItems(result.session.items);
                    setSessionStatus(result.session.status);
                    setSessionBranchId(result.session.branchId);
                    setSessionAreaId(result.session.areaId);
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

    useEffect(() => {
        if (!branches.length || !sessionAreaId) {
            return;
        }

        const branchForSessionArea = branches.find((branch) =>
            (branch.areas ?? []).some((area) => area.id === sessionAreaId)
        );

        if (!branchForSessionArea) {
            setSelectedBranchId(sessionBranchId || "");
            setSelectedAreaId(sessionAreaId);
            return;
        }

        setSelectedBranchId(branchForSessionArea.id);
        setSelectedAreaId(sessionAreaId);
    }, [branches, sessionAreaId, sessionBranchId]);

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
        status: AuditItemStatus,
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
                setSelectedStatus("AVAILABLE");
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
        if (!selectedArea) {
            setError("Select a branch and area before completing the session.");
            return;
        }

        setIsLoading(true);
        try {
            const scannedEquipmentIds = new Set(items.map((item) => item.equipmentId));

            if (selectedEquipmentTotal > items.length) {
                const equipmentResult = await fetchEquipmentAction({
                    areaId: selectedArea.id,
                });
                if (!equipmentResult.ok) {
                    setError(equipmentResult.message);
                    return;
                }

                const remainingEquipmentIds = equipmentResult.equipment
                    .map((equipment) => equipment.id)
                    .filter((equipmentId) => !scannedEquipmentIds.has(equipmentId));

                if (remainingEquipmentIds.length > 0) {
                    setRemainingEquipmentIds(remainingEquipmentIds);
                    setRemainingItemCount(remainingEquipmentIds.length);
                    setIsStatusSelectionOpen(true);
                    return;
                }
            }

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

    const handleApplyRemainingStatus = async (status: AuditItemStatus) => {
        if (!selectedArea || remainingEquipmentIds.length === 0) {
            setIsStatusSelectionOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            const fillResults = await Promise.all(
                remainingEquipmentIds.map((equipmentId) =>
                    addAuditItemAction(sessionId, equipmentId, status)
                )
            );

            for (const result of fillResults) {
                if (!result.ok) {
                    setError(result.message);
                    return;
                }
            }

            const refreshedSession = await getAuditSessionDetailAction(sessionId);
            if (refreshedSession.ok) {
                setItems(refreshedSession.session.items);
            }

            const completeResult = await completeAuditSessionAction(sessionId);
            if (completeResult.ok) {
                router.push(`/audit-history/${sessionId}`);
                return;
            }

            setError(completeResult.message);
        } finally {
            setIsLoading(false);
            setIsStatusSelectionOpen(false);
            setRemainingEquipmentIds([]);
            setRemainingItemCount(0);
        }
    };

    const handleCancelSession = async () => {
        if (!isCancelModalOpen) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await cancelAuditSessionAction(sessionId);
            if (result.ok) {
                setIsCancelModalOpen(false);
                setShowCancelSuccessToast(true);

                if (cancelSuccessTimerRef.current) {
                    clearTimeout(cancelSuccessTimerRef.current);
                }

                cancelSuccessTimerRef.current = setTimeout(() => {
                    setShowCancelSuccessToast(false);
                    router.push("/audit-history");
                }, 1400);
            } else {
                setError(result.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (cancelSuccessTimerRef.current) {
                clearTimeout(cancelSuccessTimerRef.current);
                cancelSuccessTimerRef.current = null;
            }
        };
    }, []);

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
                    onClick={() => setIsCancelModalOpen(true)}
                    disabled={isLoading || sessionStatus !== "IN_PROGRESS"}
                    className="flex-1 min-w-50 bg-stone-600 hover:bg-stone-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <StopCircleIcon className="w-4 h-4" />
                    Cancel
                </button>
            </div>

            {/* Session Location (Read-only) */}
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5 space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-stone-900">Session Location</h2>
                    <p className="text-sm text-stone-600">
                        Branch and area are locked from session start and shown here for reference.
                    </p>
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
                    &quot;Start Scanning&quot; → scan QR → choose Available, Maintenance, Retired, or Lost for that item →
                    use &quot;Add Another&quot; for continuous scanning or &quot;Save&quot; to finish the current item. The next item
                    starts from Available again, so choose it per scan.
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
                selectedBranchId={selectedBranch?.id ?? ""}
                selectedAreaId={selectedArea?.id ?? ""}
                selectedBranchName={selectedBranch?.name}
                selectedAreaName={selectedArea?.name}
                selectedStatus={selectedStatus}
                onSelectedStatusChange={setSelectedStatus}
                onSave={async (equipmentId, status, notes) => {
                    await handleAddItem(equipmentId, status, notes);
                }}
                onAddAnother={async (equipmentId, status, notes) => {
                    await handleAddItem(equipmentId, status, notes, true);
                }}
                isLoading={isLoading}
            />

            <AuditStatusSelectionModal
                isOpen={isStatusSelectionOpen}
                itemCount={remainingItemCount}
                areaName={selectedArea?.name ?? "selected area"}
                onCancel={() => {
                    setIsStatusSelectionOpen(false);
                    setRemainingEquipmentIds([]);
                    setRemainingItemCount(0);
                }}
                onApply={handleApplyRemainingStatus}
                isLoading={isLoading}
            />

            <AnimatePresence>
                {isCancelModalOpen ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
                            onClick={() => !isLoading && setIsCancelModalOpen(false)}
                            aria-hidden="true"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 10 }}
                            transition={{ type: "spring", stiffness: 420, damping: 32 }}
                            className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="cancel-session-title"
                        >
                            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
                                <div>
                                    <h2 id="cancel-session-title" className="text-xl font-semibold text-stone-900">
                                        Cancel Audit Session
                                    </h2>
                                    <p className="text-sm text-stone-600">
                                        This will stop the current session and keep the scanned items already saved.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCancelModalOpen(false)}
                                    className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                                    aria-label="Close modal"
                                    disabled={isLoading}
                                >
                                    <AlertCircleIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-3">
                                <p className="text-sm text-stone-700">
                                    Are you sure you want to cancel this audit session?
                                </p>
                                <p className="text-xs text-stone-500">
                                    You can still start a new audit session later, but this one will be marked cancelled.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-stone-200 bg-stone-50 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCancelModalOpen(false)}
                                    disabled={isLoading}
                                    className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-50"
                                >
                                    Keep Session
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleCancelSession()}
                                    disabled={isLoading}
                                    className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
                                >
                                    {isLoading ? "Cancelling..." : "Yes, Cancel"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {showCancelSuccessToast ? (
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        className="fixed right-4 top-6 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-xl"
                        role="status"
                        aria-live="polite"
                    >
                        <p className="text-sm font-semibold text-emerald-900">Cancelled successfully</p>
                        <p className="text-sm text-emerald-800">The audit session was cancelled and you are being redirected.</p>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </main>
    );
}
