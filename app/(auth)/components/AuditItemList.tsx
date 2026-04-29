"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  ChevronRightIcon,
} from "lucide-react";
import type { AuditSessionItemDetail } from "@/app/_actions/audit-history";

type AuditItemListProps = {
  items: AuditSessionItemDetail[];
  sessionId?: string;
  isEditable?: boolean;
};

function getStatusBadge(status: string) {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "MAINTENANCE":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "RETIRED":
      return "bg-stone-100 text-stone-800 border-stone-200";
    case "LOST":
      return "bg-rose-100 text-rose-800 border-rose-200";
    default:
      return "bg-stone-100 text-stone-800 border-stone-200";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "AVAILABLE":
      return "Available";
    case "MAINTENANCE":
      return "Maintenance";
    case "RETIRED":
      return "Retired";
    case "LOST":
      return "Lost";
    default:
      return status;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "AVAILABLE":
      return <CheckCircleIcon className="w-5 h-5 text-emerald-600" />;
    case "MAINTENANCE":
      return <AlertCircleIcon className="w-5 h-5 text-amber-600" />;
    case "RETIRED":
      return <CheckCircleIcon className="w-5 h-5 text-stone-600" />;
    case "LOST":
      return <XCircleIcon className="w-5 h-5 text-rose-600" />;
    default:
      return <CheckCircleIcon className="w-5 h-5 text-stone-600" />;
  }
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function AuditItemList({
  items,
  sessionId,
  isEditable = false,
}: AuditItemListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200">
        <AlertCircleIcon className="w-12 h-12 text-stone-400 mx-auto mb-3" />
        <p className="text-stone-600 font-medium mb-1">No items scanned yet</p>
        <p className="text-stone-500 text-sm">
          Scan items to add them to this audit session.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const href = sessionId ? `/audit-history/${sessionId}/items/${item.id}` : '#';
        const isLink = !!sessionId;

        const content = (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(item.status)}
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(item.status)}`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Equipment Model</p>
                    <p className="text-sm font-semibold text-stone-900">
                      {item.equipment.equipmentModel.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-stone-500 mb-1">SKU</p>
                      <p className="text-sm font-mono text-stone-700">
                        {item.equipment.sku || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500 mb-1">QR Code</p>
                      <p className="text-sm font-mono text-stone-700 truncate">
                        {item.equipment.qrCode}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-stone-500 mb-1">Type</p>
                    <p className="text-sm text-stone-700">
                      {item.equipment.equipmentModel.type}
                    </p>
                  </div>

                  {item.notes && (
                    <div>
                      <p className="text-xs text-stone-500 mb-1">Notes</p>
                      <p className="text-sm text-stone-700 line-clamp-2">
                        {item.notes}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-stone-500">
                      Scanned at {formatDateTime(item.scannedAt)}
                    </p>
                  </div>
                </div>
              </div>
              {isLink && (
                <ChevronRightIcon className="w-5 h-5 text-stone-400 flex-shrink-0 ml-4" />
              )}
            </div>
          </div>
        );

        return isLink ? (
          <Link key={item.id} href={href}>
            {content}
          </Link>
        ) : (
          <div key={item.id}>{content}</div>
        );
      })}
    </div>
  );
}
