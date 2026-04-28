import React from 'react';
import { XIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { EquipmentListItem } from '@/app/_actions/equipment';

interface ViewEquipmentListProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquipmentListItem | null;
}

function getStatusLabel(status: EquipmentListItem['status']) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function ViewEquipmentList({ isOpen, onClose, equipment }: ViewEquipmentListProps) {
  return (
    <AnimatePresence>
      {isOpen && equipment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-xl max-h-[85vh] bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-equipment-title"
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-stone-200 shrink-0">
              <div>
                <h2 id="view-equipment-title" className="text-base font-semibold text-stone-900">
                  Equipment Details
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Read-only snapshot of the selected equipment item
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">QR Code</label>
                  <input
                    type="text"
                    value={equipment.qrCode}
                    readOnly
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">SKU</label>
                  <input
                    type="text"
                    value={equipment.sku ?? '—'}
                    readOnly
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">Model</label>
                  <input
                    type="text"
                    value={equipment.modelName}
                    readOnly
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">Type</label>
                  <input
                    type="text"
                    value={equipment.modelType}
                    readOnly
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">Status</label>
                  <input
                    type="text"
                    value={getStatusLabel(equipment.status)}
                    readOnly
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">Registered</label>
                  <input
                    type="text"
                    value={equipment.createdAt}
                    readOnly
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">Purchase Date</label>
                  <input
                    type="text"
                    value={equipment.purchaseDate ?? '—'}
                    readOnly
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">Area</label>
                  <input
                    type="text"
                    value={equipment.areaName}
                    readOnly
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">Branch</label>
                  <input
                    type="text"
                    value={equipment.branchName}
                    readOnly
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                  />
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                <label className="block text-xs font-medium text-stone-700">Created By</label>
                <input
                  type="text"
                  value={equipment.createdBy}
                  readOnly
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 bg-stone-50 border-t border-stone-200 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}