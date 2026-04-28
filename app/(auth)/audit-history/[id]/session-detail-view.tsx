"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, AlertCircleIcon } from "lucide-react";
import {
  getAuditSessionDetailAction,
} from "@/app/_actions/audit-history";
import { AuditItemList } from "../../components/AuditItemList";
import type { AuditSessionDetail } from "@/app/_actions/audit-history";

type SessionDetailViewProps = {
  sessionId: string;
};

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getStatusColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "CANCELLED":
      return "bg-stone-100 text-stone-800 border-stone-200";
    default:
      return "bg-stone-100 text-stone-800 border-stone-200";
  }
}

export function SessionDetailView({ sessionId }: SessionDetailViewProps) {
  const router = useRouter();
  const [session, setSession] = useState<AuditSessionDetail | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const result = await getAuditSessionDetailAction(sessionId);
        if (result.ok) {
          setSession(result.session);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError("Failed to load session details");
        console.error(err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (isFetching) {
    return (
      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading session details...</p>
        </div>
      </main>
    );
  }

  if (!session) {
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
          <h1 className="text-2xl font-bold text-stone-900">Session Not Found</h1>
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

  const failedCount = session.items.filter((i) => i.status === "FAIL").length;
  const missingCount = session.items.filter(
    (i) => i.status === "MISSING"
  ).length;
  const passCount = session.items.filter((i) => i.status === "PASS").length;

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
            <h1 className="text-2xl font-bold text-stone-900">
              Audit Session Details
            </h1>
            <p className="text-stone-600">
              {session.items.length} item{session.items.length !== 1 ? "s" : ""}{" "}
              scanned
            </p>
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(session.status)}`}
          >
            {session.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-stone-500 mb-1">Started By</p>
            <p className="text-sm font-semibold text-stone-900">
              {session.startedBy.name}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500 mb-1">Started At</p>
            <p className="text-sm font-semibold text-stone-900">
              {formatDateTime(session.startedAt)}
            </p>
          </div>
          {session.completedAt && (
            <>
              <div>
                <p className="text-xs text-stone-500 mb-1">Completed At</p>
                <p className="text-sm font-semibold text-stone-900">
                  {formatDateTime(session.completedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-1">Duration</p>
                <p className="text-sm font-semibold text-stone-900">
                  {Math.round(
                    (new Date(session.completedAt).getTime() -
                      new Date(session.startedAt).getTime()) /
                      1000 /
                      60
                  )}{" "}
                  minutes
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 text-center">
          <p className="text-stone-600 text-xs mb-1">Total Items</p>
          <p className="text-2xl font-bold text-stone-900">
            {session.items.length}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm p-4 text-center">
          <p className="text-emerald-700 text-xs mb-1">Passed</p>
          <p className="text-2xl font-bold text-emerald-900">{passCount}</p>
        </div>
        <div className="bg-rose-50 rounded-xl border border-rose-200 shadow-sm p-4 text-center">
          <p className="text-rose-700 text-xs mb-1">Failed</p>
          <p className="text-2xl font-bold text-rose-900">{failedCount}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-4 text-center">
          <p className="text-amber-700 text-xs mb-1">Missing</p>
          <p className="text-2xl font-bold text-amber-900">{missingCount}</p>
        </div>
      </div>

      {/* Scanned Items */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 mb-4">
          Scanned Items
        </h2>
        <AuditItemList items={session.items} sessionId={sessionId} />
      </div>
    </main>
  );
}
