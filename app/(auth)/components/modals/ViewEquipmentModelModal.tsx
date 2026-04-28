import React from 'react';
import { XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EquipmentModelListItem } from '@/app/_actions/equipmentmodel';

interface ViewEquipmentModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: EquipmentModelListItem | null;
}

function getTypeLabel(type: EquipmentModelListItem['type']) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export function ViewEquipmentModelModal({
  isOpen,
  onClose,
  model,
}: ViewEquipmentModelModalProps) {
  return (
    <AnimatePresence>
      {isOpen && model ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4 sm:px-6">
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
            className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-xl shadow-xl border border-stone-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-equipment-model-title"
          >
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <div>
                <h2 id="view-equipment-model-title" className="text-lg font-semibold text-stone-900">
                  View Equipment Model
                </h2>
                <p className="text-sm text-stone-500 mt-0.5">Model details and metadata</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {model.photoUrl ? (
                <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                  <img
                    src={model.photoUrl}
                    alt={model.name}
                    className="h-56 w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700">Model Name</label>
                <input
                  type="text"
                  value={model.name}
                  readOnly
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700">Model Code</label>
                <input
                  type="text"
                  value={model.modelCode ?? '—'}
                  readOnly
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700">Description</label>
                <textarea
                  value={model.description || 'No description'}
                  readOnly
                  rows={3}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-700">Type</label>
                  <input
                    type="text"
                    value={getTypeLabel(model.type)}
                    readOnly
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-700">Price</label>
                  <input
                    type="text"
                    value={model.price ?? '—'}
                    readOnly
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-700">Life Expectancy</label>
                  <input
                    type="text"
                    value={model.lifeExpectancy != null ? `${model.lifeExpectancy} years` : '—'}
                    readOnly
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-700">Units</label>
                  <input
                    type="text"
                    value={String(model.unitCount)}
                    readOnly
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-700">Created</label>
                  <input
                    type="text"
                    value={`${model.createdAt} by ${model.createdBy}`}
                    readOnly
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg shadow-sm text-sm bg-stone-50 text-stone-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-stone-50 border-t border-stone-200">
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
