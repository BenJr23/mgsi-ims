import React from 'react';
import { AlertTriangleIcon, XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentLabel: string;
  onConfirm: () => Promise<void> | void;
  isDeleting: boolean;
}

export function DeleteEquipmentModal({
  isOpen,
  onClose,
  equipmentLabel,
  onConfirm,
  isDeleting,
}: DeleteEquipmentModalProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-equipment-title"
          >
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-rose-100 text-rose-600">
                  <AlertTriangleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="delete-equipment-title" className="text-lg font-semibold text-stone-900">
                    Delete Equipment
                  </h2>
                  <p className="text-sm text-stone-500 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                aria-label="Close modal"
                disabled={isDeleting}
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-stone-700">
                Are you sure you want to delete <span className="font-medium text-stone-900">{equipmentLabel}</span>?
              </p>
              <p className="text-xs text-stone-500">
                This will remove the equipment from active listings.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-stone-50 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onConfirm()}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 border border-transparent rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete Equipment'}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
