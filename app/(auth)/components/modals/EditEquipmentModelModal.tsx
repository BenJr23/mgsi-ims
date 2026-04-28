import React from 'react';
import { XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EquipmentModelListItem } from '@/app/_actions/equipmentmodel';

type EquipmentType = 'FURNITURE' | 'ELECTRONICS' | 'APPLIANCE' | 'TOOL' | 'OTHER';

interface EditEquipmentModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: EquipmentModelListItem | null;
  isSubmitting: boolean;
  onSubmit: (data: {
    name: string;
    description: string;
    type: EquipmentType;
    price: string;
    photoFile: File | null;
  }) => Promise<void> | void;
}

const EQUIPMENT_TYPES: { label: string; value: EquipmentType }[] = [
  { label: 'Furniture', value: 'FURNITURE' },
  { label: 'Electronics', value: 'ELECTRONICS' },
  { label: 'Appliance', value: 'APPLIANCE' },
  { label: 'Tool', value: 'TOOL' },
  { label: 'Other', value: 'OTHER' },
];

export function EditEquipmentModelModal({
  isOpen,
  onClose,
  model,
  isSubmitting,
  onSubmit,
}: EditEquipmentModelModalProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    void onSubmit({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as EquipmentType,
      price: formData.get('price') as string,
      photoFile: (() => {
        const file = formData.get('photoFile');
        return file instanceof File && file.size > 0 ? file : null;
      })(),
    });
  };

  return (
    <AnimatePresence>
      {isOpen && model ? (
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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-equipment-model-title"
          >
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <div>
                <h2 id="edit-equipment-model-title" className="text-lg font-semibold text-stone-900">
                  Edit Equipment Model
                </h2>
                <p className="text-sm text-stone-500 mt-0.5">Update the selected equipment model details</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="edit-model-name" className="block text-sm font-medium text-black">
                    Model Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-model-name"
                    name="name"
                    required
                    defaultValue={model.name}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-model-description" className="block text-sm font-medium text-black">
                    Description
                  </label>
                  <textarea
                    id="edit-model-description"
                    name="description"
                    rows={3}
                    defaultValue={model.description}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-model-photo" className="block text-sm font-medium text-black">
                    Photo
                  </label>
                  {model.photoUrl ? (
                    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                      <img
                        src={model.photoUrl}
                        alt={model.name}
                        className="h-32 w-full rounded-md object-cover"
                      />
                    </div>
                  ) : null}
                  <input
                    type="file"
                    id="edit-model-photo"
                    name="photoFile"
                    accept="image/*"
                    className="block w-full text-sm text-stone-700 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-amber-900 hover:file:bg-amber-200"
                  />
                  <p className="text-xs text-gray-600">
                    Optional. Choose a new photo to replace the current one.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-model-type" className="block text-sm font-medium text-black">
                    Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="edit-model-type"
                    name="type"
                    required
                    defaultValue={model.type}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
                  >
                    {EQUIPMENT_TYPES.map((equipmentType) => (
                      <option key={equipmentType.value} value={equipmentType.value}>
                        {equipmentType.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-model-price" className="block text-sm font-medium text-black">
                    Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">P</span>
                    <input
                      type="text"
                      id="edit-model-price"
                      name="price"
                      defaultValue={model.price ?? ''}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-stone-50 border-t border-stone-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-black bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
