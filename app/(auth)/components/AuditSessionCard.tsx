"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "lucide-react";
import type { AuditSessionWithItems } from "@/app/_actions/audit-history";

type AuditSessionCardProps = {
  session: AuditSessionWithItems;
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

function getStatusBadge(status: string) {
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

function getStatusIcon(status: string) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircleIcon className="w-5 h-5 text-emerald-600" />;
    case "IN_PROGRESS":
      return <ClockIcon className="w-5 h-5 text-blue-600" />;
    case "CANCELLED":
      return <XCircleIcon className="w-5 h-5 text-stone-600" />;
    default:
      return <ClockIcon className="w-5 h-5 text-stone-600" />;
  }
}

export function AuditSessionCard({ session }: AuditSessionCardProps) {
  const isCompleted = session.status === "COMPLETED";
  const href = isCompleted
    ? `/audit-history/${session.id}`
    : `/audit-history/new-session?sessionId=${session.id}`;

  return (
    <Link href={href}>
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(session.status)}
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(session.status)}`}
              >
                {session.status}
              </span>
            </div>
            <p className="text-sm text-stone-600">
              Started by {session.startedBy.name}
            </p>
          </div>
          <ChevronRightIcon className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-stone-500 mb-1">Start Time</p>
            <p className="text-sm font-medium text-stone-900">
              {formatDateTime(session.startedAt)}
            </p>
          </div>
          {session.completedAt && (
            <div>
              <p className="text-xs text-stone-500 mb-1">Completed</p>
              <p className="text-sm font-medium text-stone-900">
                {formatDateTime(session.completedAt)}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-stone-200 pt-4">
          <p className="text-sm">
            <span className="text-stone-600">Items scanned: </span>
            <span className="font-semibold text-stone-900">
              {session.itemCount}
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
