import React from 'react';
import { XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
type EquipmentType =
  'FURNITURE' |
  'ELECTRONICS' |
  'APPLIANCE' |
  'TOOL' |
  'OTHER';
interface AddModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    modelCode: string;
    description: string;
    type: EquipmentType;
    price: string;
    lifeExpectancy: string;
    photoFile: File | null;
  }) => Promise<void> | void;
}
const EQUIPMENT_TYPES: {
  label: string;
  value: EquipmentType;
}[] = [
    {
      label: 'Furniture',
      value: 'FURNITURE'
    },
    {
      label: 'Electronics',
      value: 'ELECTRONICS'
    },
    {
      label: 'Appliance',
      value: 'APPLIANCE'
    },
    {
      label: 'Tool',
      value: 'TOOL'
    },
    {
      label: 'Other',
      value: 'OTHER'
    }];

export function AddModelModal({
  isOpen,
  onClose,
  onSubmit
}: AddModelModalProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    void onSubmit({
      name: formData.get('name') as string,
      modelCode: formData.get('modelCode') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as EquipmentType,
      price: formData.get('price') as string,
      lifeExpectancy: formData.get('lifeExpectancy') as string,
      photoFile: (() => {
        const file = formData.get('photoFile');
        return file instanceof File && file.size > 0 ? file : null;
      })(),
    });
  };
  return (
    <AnimatePresence>
      {isOpen &&
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            transition={{
              duration: 0.15
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true" />


          {/* Modal */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 10
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 10
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30
            }}
            className="relative w-full max-w-lg mx-4 my-4 max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-xl shadow-xl border border-stone-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-model-title">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <div>
                <h2
                  id="add-model-title"
                  className="text-lg font-semibold text-black">

                  Add Equipment Model
                </h2>
                <p className="text-sm text-gray-700 mt-0.5">
                  Define a new equipment template for your catalog
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                aria-label="Close modal">

                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="model-name"
                    className="block text-sm font-medium text-black">

                    Model Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="model-name"
                    name="name"
                    required
                    placeholder="e.g. Standing Desk Pro"
                    className=" w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-gray-600" />

                </div>

                <div className="space-y-2">
                  <label htmlFor="model-code" className="block text-sm font-medium text-black">
                    Model Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="model-code"
                    name="modelCode"
                    required
                    placeholder="e.g. DESK-PRO-01"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-gray-600"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label
                    htmlFor="model-description"
                    className="block text-sm font-medium text-black">

                    Description
                  </label>
                  <textarea
                    id="model-description"
                    name="description"
                    rows={3}
                    placeholder="Brief description of this equipment model..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-gray-600 resize-none" />

                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="model-type"
                    className="block text-sm font-medium text-black">

                    Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="model-type"
                    name="type"
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white">

                    <option value="" disabled className="text-gray-600">
                      Select type...
                    </option>
                    {EQUIPMENT_TYPES.map((t) =>
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="model-life-expectancy" className="block text-sm font-medium text-black">
                    Life Expectancy
                  </label>
                  <input
                    type="number"
                    id="model-life-expectancy"
                    name="lifeExpectancy"
                    min="0"
                    step="1"
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-gray-600"
                  />
                  <p className="text-xs text-gray-600">
                    Optional whole number in years.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="model-photo" className="block text-sm font-medium text-black">
                    Photo
                  </label>
                  <input
                    type="file"
                    id="model-photo"
                    name="photoFile"
                    accept="image/*"
                    className="block w-full text-sm text-stone-700 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-amber-900 hover:file:bg-amber-200"
                  />
                  <p className="text-xs text-gray-600">
                    Optional. This photo will be shown for the equipment model.
                  </p>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <label
                    htmlFor="model-price"
                    className="block text-sm font-medium text-black">

                    Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                      ₱
                    </span>
                    <input
                      type="text"
                      id="model-price"
                      name="price"
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-gray-600" />

                  </div>
                  <p className="text-xs text-gray-600">
                    Optional. Unit price for this equipment model.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-stone-50 border-t border-stone-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-black bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">

                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">

                  Add Model
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}