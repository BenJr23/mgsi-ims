"use client";

import React, { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import type { AuditItemStatus } from "@/app/generated/prisma/enums";

type AuditStatusSelectionModalProps = {
  isOpen: boolean;
  itemCount: number;
  areaName: string;
  onCancel: () => void;
  onApply: (status: AuditItemStatus) => void | Promise<void>;
  isLoading?: boolean;
};

type AuditStatusChoice = {
  label: string;
  value: AuditItemStatus;
  description: string;
  colorClass: string;
};

const STATUS_CHOICES: AuditStatusChoice[] = [
  {
    label: "Available",
    value: "AVAILABLE",
    description: "Mark the remaining items as available.",
    colorClass: "bg-emerald-600 text-white",
  },
  {
    label: "Maintenance",
    value: "MAINTENANCE",
    description: "Mark the remaining items as needing maintenance.",
    colorClass: "bg-amber-600 text-white",
  },
  {
    label: "Retired",
    value: "RETIRED",
    description: "Mark the remaining items as retired from service.",
    colorClass: "bg-stone-600 text-white",
  },
  {
    label: "Lost",
    value: "LOST",
    description: "Mark the remaining items as lost or unaccounted for.",
    colorClass: "bg-rose-600 text-white",
  },
];

export function AuditStatusSelectionModal({
  isOpen,
  itemCount,
  areaName,
  onCancel,
  onApply,
  isLoading = false,
}: AuditStatusSelectionModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<AuditItemStatus>("AVAILABLE");

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus("AVAILABLE");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">Apply Status to Remaining Items</h2>
            <p className="text-sm text-stone-600">
              {itemCount} unscanned item{itemCount !== 1 ? "s" : ""} found in {areaName}.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-2 hover:bg-stone-100 transition"
            disabled={isLoading}
            aria-label="Close"
          >
            <XIcon className="h-5 w-5 text-stone-500" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <p className="text-sm text-stone-600">
            Choose the status that should be applied to all remaining unscanned items before the session is completed.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {STATUS_CHOICES.map((choice) => {
              const isActive = selectedStatus === choice.value;

              return (
                <button
                  key={choice.value}
                  onClick={() => setSelectedStatus(choice.value)}
                  className={`rounded-xl border px-4 py-4 text-left transition ${
                    isActive
                      ? choice.colorClass + " border-transparent"
                      : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <p className="font-semibold">{choice.label}</p>
                  <p className={`mt-1 text-xs ${isActive ? "text-white/80" : "text-stone-500"}`}>
                    {choice.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 border-t border-stone-200 bg-stone-50 px-6 py-4">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-stone-200 bg-white px-4 py-2.5 font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void onApply(selectedStatus)}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-yellow-500 px-4 py-2.5 font-semibold text-white transition hover:bg-yellow-600 disabled:opacity-50"
          >
            {isLoading ? "Applying..." : "Apply & Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}