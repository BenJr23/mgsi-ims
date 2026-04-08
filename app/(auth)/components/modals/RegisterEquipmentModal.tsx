import React from 'react';
import { XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type EquipmentStatus = 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED' | 'LOST';

interface RegisterEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    equipmentModelId: string;
    status: EquipmentStatus;
    areaId: string;
  }) => Promise<boolean>;
  isSubmitting?: boolean;
  models: {
    id: string;
    name: string;
  }[];
  areas: {
    id: string;
    name: string;
  }[];
}

const STATUS_OPTIONS: {
  label: string;
  value: EquipmentStatus;
}[] = [
  {
    label: 'Available',
    value: 'AVAILABLE',
  },
  {
    label: 'Maintenance',
    value: 'MAINTENANCE',
  },
  {
    label: 'Retired',
    value: 'RETIRED',
  },
  {
    label: 'Lost',
    value: 'LOST',
  },
];

export function RegisterEquipmentModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  models,
  areas,
}: RegisterEquipmentModalProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await onSubmit({
      equipmentModelId: formData.get('equipmentModelId') as string,
      status: formData.get('status') as EquipmentStatus,
      areaId: formData.get('areaId') as string,
    });

    if (result) {
      e.currentTarget.reset();
      onClose();
    }
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
          className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-equipment-title">
          
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <div>
                <h2
                id="register-equipment-title"
                className="text-lg font-semibold text-stone-900">
                
                  Register Equipment
                </h2>
                <p className="text-sm text-stone-500 mt-0.5">
                  Add a new individual equipment item to the inventory
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
                {/* Equipment Model */}
                <div className="space-y-2">
                  <label
                  htmlFor="equip-model"
                  className="block text-sm font-medium text-stone-700">
                  
                    Equipment Model <span className="text-rose-500">*</span>
                  </label>
                  <select
                  id="equip-model"
                  name="equipmentModelId"
                  required
                  defaultValue=""
                  disabled={isSubmitting || models.length === 0}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white">
                  
                    <option value="" disabled>
                      Select a model...
                    </option>
                    {models.map((m) =>
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    )}
                  </select>
                </div>

                <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/80 px-4 py-3 text-sm text-stone-600">
                  SKU and QR link are generated automatically when the equipment is registered.
                </div>

                {/* Status + Area row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                    htmlFor="equip-status"
                    className="block text-sm font-medium text-stone-700">
                    
                      Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                    id="equip-status"
                    name="status"
                    required
                    defaultValue="AVAILABLE"
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white">
                    
                      {STATUS_OPTIONS.map((s) =>
                    <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                    )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                    htmlFor="equip-area"
                    className="block text-sm font-medium text-stone-700">
                    
                      Assigned Area <span className="text-rose-500">*</span>
                    </label>
                    <select
                    id="equip-area"
                    name="areaId"
                    required
                    defaultValue=""
                    disabled={isSubmitting || areas.length === 0}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white">
                    
                        <option value="" disabled>
                        Select area...
                      </option>
                        {areas.map((a) =>
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-stone-50 border-t border-stone-200">
                <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
                
                  Cancel
                </button>
                <button
                type="submit"
                disabled={isSubmitting || models.length === 0 || areas.length === 0}
                className="px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
                
                  {isSubmitting ? 'Registering...' : 'Register Equipment'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}