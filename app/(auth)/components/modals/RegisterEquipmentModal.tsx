import React, { useEffect, useMemo, useRef, useState } from 'react';
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

type SearchableOption = {
  id: string;
  name: string;
};

function SearchableSelect({
  id,
  name,
  options,
  selectedId,
  onSelect,
  placeholder,
  disabled = false,
}: {
  id: string;
  name: string;
  options: SearchableOption[];
  selectedId: string;
  onSelect: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedId) ?? null,
    [options, selectedId],
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = inputValue.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => option.name.toLowerCase().includes(normalizedQuery));
  }, [options, inputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setInputValue(selectedOption?.name ?? '');
  }, [selectedOption]);

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" id={id} name={name} value={selectedId} />

      <input
        type="text"
        disabled={disabled}
        value={inputValue}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          const value = event.target.value;
          setInputValue(value);
          setIsOpen(true);

          const exactMatch = options.find(
            (option) => option.name.toLowerCase() === value.trim().toLowerCase(),
          );

          onSelect(exactMatch?.id ?? '');
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-left text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white disabled:bg-stone-100 disabled:text-stone-400"
      />

      {isOpen && !disabled && (
        <div className="mt-2 w-full rounded-lg border border-stone-200 bg-white shadow-sm">
          <ul className="max-h-40 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-stone-500">No results found</li>
            ) : (
              filteredOptions.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(option.id);
                      setInputValue(option.name);
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-black hover:bg-amber-50 transition-colors"
                  >
                    {option.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function RegisterEquipmentModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  models,
  areas,
}: RegisterEquipmentModalProps) {
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedModelId('');
      setSelectedAreaId('');
    }
  }, [isOpen]);

  const closeModal = () => {
    setSelectedModelId('');
    setSelectedAreaId('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await onSubmit({
      equipmentModelId: selectedModelId,
      status: formData.get('status') as EquipmentStatus,
      areaId: selectedAreaId,
    });

    if (result) {
      e.currentTarget.reset();
      closeModal();
    }
  };

  return (
    <AnimatePresence>
      {isOpen &&
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            onClick={closeModal}
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
            className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden max-h-[85vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-equipment-title">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <div>
                <h2
                  id="register-equipment-title"
                  className="text-lg font-semibold text-black">

                  Register Equipment
                </h2>
                <p className="text-sm text-gray-700 mt-0.5">
                  Add a new individual equipment item to the inventory
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                aria-label="Close modal">

                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="p-6 space-y-5 overflow-y-auto min-h-0">
                {/* Equipment Model */}
                <div className="space-y-2">
                  <label
                    htmlFor="equip-model"
                    className="block text-sm font-medium text-black">

                    Equipment Model <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    id="equip-model"
                    name="equipmentModelId"
                    options={models}
                    selectedId={selectedModelId}
                    onSelect={setSelectedModelId}
                    placeholder="Select a model..."
                    disabled={isSubmitting || models.length === 0}
                  />
                </div>

                <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/80 px-4 py-3 text-sm text-gray-700">
                  SKU and QR link are generated automatically when the equipment is registered.
                </div>

                {/* Status + Area row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="equip-status"
                      className="block text-sm font-medium text-black">

                      Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="equip-status"
                      name="status"
                      required
                      defaultValue="AVAILABLE"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white">

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
                      className="block text-sm font-medium text-black">

                      Assigned Area <span className="text-rose-500">*</span>
                    </label>
                    <SearchableSelect
                      id="equip-area"
                      name="areaId"
                      options={areas}
                      selectedId={selectedAreaId}
                      onSelect={setSelectedAreaId}
                      placeholder="Select area..."
                      disabled={isSubmitting || areas.length === 0}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-stone-50 border-t border-stone-200">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-black bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">

                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    models.length === 0 ||
                    areas.length === 0 ||
                    !selectedModelId ||
                    !selectedAreaId
                  }
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