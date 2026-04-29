"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { createAuditSessionAction } from "@/app/_actions/audit-history";
import type { AuditSessionWithItems } from "@/app/_actions/audit-history";
import { fetchBranchesAction, type BranchItem } from "@/app/_actions/branches";
import { AuditSessionCard } from "@/app/(auth)/components/AuditSessionCard";

type AuditHistoryViewProps = {
    initialSessions: AuditSessionWithItems[];
};

export function AuditHistoryView({
    initialSessions,
}: AuditHistoryViewProps) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [isLoadingBranches, setIsLoadingBranches] = useState(true);
    const [sessions, setSessions] = useState(initialSessions);
    const [branches, setBranches] = useState<BranchItem[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [selectedAreaId, setSelectedAreaId] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadBranches = async () => {
            try {
                const result = await fetchBranchesAction();
                if (!result.ok) {
                    setError(result.message);
                    setBranches([]);
                    return;
                }

                setBranches(result.branches);
                const initialBranch = result.branches[0];
                const initialArea = initialBranch?.areas?.[0];
                setSelectedBranchId(initialBranch?.id ?? "");
                setSelectedAreaId(initialArea?.id ?? "");
            } catch (fetchError) {
                console.error(fetchError);
                setError("Failed to load branches and areas.");
            } finally {
                setIsLoadingBranches(false);
            }
        };

        void loadBranches();
    }, []);

    const selectedBranch = useMemo(
        () => branches.find((branch) => branch.id === selectedBranchId) ?? null,
        [branches, selectedBranchId]
    );

    const selectedAreas = selectedBranch?.areas ?? [];

    useEffect(() => {
        if (!selectedBranch) {
            setSelectedAreaId("");
            return;
        }

        const areaStillExists = selectedAreas.some((area) => area.id === selectedAreaId);
        if (!areaStillExists) {
            setSelectedAreaId(selectedAreas[0]?.id ?? "");
        }
    }, [selectedAreaId, selectedAreas, selectedBranch]);

    const canStartSession = Boolean(selectedBranchId && selectedAreaId) && !isLoadingBranches;

    const handleStartAuditSession = async () => {
        if (!selectedAreaId) {
            setError("Select an area before starting an audit session.");
            return;
        }

        setError(null);
        setIsCreating(true);
        try {
            const result = await createAuditSessionAction(selectedAreaId);
            if (result.ok) {
                router.push(`/audit-history/new-session?sessionId=${result.sessionId}`);
                return;
            }

            setError(result.message);
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
                    Select a branch and area before starting a new audit session.
                </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-4 grid gap-4 md:grid-cols-2">
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
                        disabled={isLoadingBranches || branches.length === 0 || isCreating}
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
                        disabled={isLoadingBranches || selectedAreas.length === 0 || isCreating}
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

            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            {/* Start Audit Session CTA */}
            <button
                onClick={handleStartAuditSession}
                disabled={isCreating || !canStartSession}
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
