import React from 'react';
import { XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type EquipmentStatus = 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED' | 'LOST';

interface EditEquipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        equipmentId: string;
        status: EquipmentStatus;
        areaId: string;
        purchaseDate: string | null;
        photoFile: File | null;
    }) => Promise<boolean>;
    isSubmitting?: boolean;
    equipment: {
        id: string;
        sku: string | null;
        status: EquipmentStatus;
        areaId: string;
        purchaseDate: string | null;
        photoUrl?: string | null;
    } | null;
    areas: {
        id: string;
        name: string;
    }[];
}

const STATUS_OPTIONS: Array<{ label: string; value: EquipmentStatus }> = [
    { label: 'Available', value: 'AVAILABLE' },
    { label: 'Maintenance', value: 'MAINTENANCE' },
    { label: 'Retired', value: 'RETIRED' },
    { label: 'Lost', value: 'LOST' },
];

export function EditEquipmentModal({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting = false,
    equipment,
    areas,
}: EditEquipmentModalProps) {
    const closeModal = () => {
        onClose();
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!equipment) {
            return;
        }

        const formData = new FormData(event.currentTarget);
        const status = String(formData.get('status') ?? 'AVAILABLE') as EquipmentStatus;
        const areaId = String(formData.get('areaId') ?? '').trim();
        const purchaseDate = String(formData.get('purchaseDate') ?? '').trim() || null;
        const photoFile = (() => {
            const file = formData.get('photoFile');
            return file instanceof File && file.size > 0 ? file : null;
        })();

        if (!areaId) {
            return;
        }

        const success = await onSubmit({
            equipmentId: equipment.id,
            status,
            areaId,
            purchaseDate,
            photoFile,
        });

        if (success) {
            closeModal();
        }
    };

    return (
        <AnimatePresence>
            {isOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={closeModal}
                        aria-hidden="true"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-equipment-title"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-stone-200">
                            <div>
                                <h2 id="edit-equipment-title" className="text-lg font-semibold text-black">
                                    Edit Equipment
                                </h2>
                                <p className="text-sm text-gray-700 mt-0.5">
                                    Update status and location for {equipment?.sku ?? 'selected equipment'}.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="edit-photo" className="block text-sm font-medium text-black">
                                    Replace Photo
                                </label>
                                {equipment?.photoUrl ? (
                                    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                                        <img
                                            src={equipment.photoUrl}
                                            alt={equipment.sku ?? 'equipment photo'}
                                            className="h-32 w-full rounded-md object-cover"
                                        />
                                    </div>
                                ) : null}
                                <input
                                    id="edit-photo"
                                    name="photoFile"
                                    type="file"
                                    accept="image/*"
                                    disabled={isSubmitting}
                                    className="block w-full text-sm text-stone-700 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-amber-900 hover:file:bg-amber-200"
                                />
                                <p className="text-xs text-stone-500">Optional. Choose a new photo to replace the current one.</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                                aria-label="Close modal"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form key={equipment?.id ?? 'edit-equipment-form'} onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="edit-status" className="block text-sm font-medium text-black">
                                    Status <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    id="edit-status"
                                    name="status"
                                    defaultValue={equipment?.status ?? 'AVAILABLE'}
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
                                    required
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="edit-area" className="block text-sm font-medium text-black">
                                    Area <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    id="edit-area"
                                    name="areaId"
                                    defaultValue={equipment?.areaId ?? ''}
                                    disabled={isSubmitting || areas.length === 0}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
                                    required
                                >
                                    <option value="" disabled>
                                        Select an area
                                    </option>
                                    {areas.map((area) => (
                                        <option key={area.id} value={area.id}>
                                            {area.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="edit-purchase-date" className="block text-sm font-medium text-black">
                                    Purchase Date
                                </label>
                                <input
                                    id="edit-purchase-date"
                                    name="purchaseDate"
                                    type="date"
                                    defaultValue={equipment?.purchaseDate ?? ''}
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
                                />
                                <p className="text-xs text-stone-500">Optional. Update the purchase date if needed.</p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !equipment}
                                    className="px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
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
