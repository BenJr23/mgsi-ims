import React from 'react';
import { XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
type EquipmentStatus = 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED' | 'LOST';
interface RegisterEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    qrCode: string;
    serialNumber: string;
    equipmentModelId: string;
    status: EquipmentStatus;
    areaId: string;
  }) => void;
}
const MOCK_MODELS = [
{
  id: 'm1',
  name: 'Standing Desk Pro'
},
{
  id: 'm2',
  name: 'Dell UltraSharp 27"'
},
{
  id: 'm3',
  name: 'Ergonomic Office Chair'
},
{
  id: 'm4',
  name: 'MacBook Pro 16"'
},
{
  id: 'm5',
  name: 'Commercial Coffee Machine'
},
{
  id: 'm6',
  name: 'Cordless Drill Kit'
},
{
  id: 'm7',
  name: 'Whiteboard 6x4ft'
},
{
  id: 'm8',
  name: 'Network Switch 48-Port'
},
{
  id: 'm9',
  name: 'Mini Fridge'
},
{
  id: 'm10',
  name: 'Safety Toolkit'
}];

const MOCK_AREAS = [
{
  id: 'a1',
  name: 'Reception — Main HQ'
},
{
  id: 'a2',
  name: 'Open Office — Main HQ'
},
{
  id: 'a3',
  name: 'Server Room — Main HQ'
},
{
  id: 'a4',
  name: 'Conference Room A — Main HQ'
},
{
  id: 'a5',
  name: 'Kitchen — Main HQ'
},
{
  id: 'a7',
  name: 'Sales Floor — Downtown'
},
{
  id: 'a8',
  name: 'Back Office — Downtown'
},
{
  id: 'a9',
  name: 'Break Room — Downtown'
},
{
  id: 'a11',
  name: 'Loading Dock — East Side'
},
{
  id: 'a12',
  name: 'Storage Zone A — East Side'
},
{
  id: 'a14',
  name: 'Packing Station — East Side'
},
{
  id: 'a16',
  name: 'Receiving — South DC'
},
{
  id: 'a17',
  name: 'Sorting — South DC'
}];

const STATUS_OPTIONS: {
  label: string;
  value: EquipmentStatus;
}[] = [
{
  label: 'Available',
  value: 'AVAILABLE'
},
{
  label: 'Maintenance',
  value: 'MAINTENANCE'
},
{
  label: 'Retired',
  value: 'RETIRED'
},
{
  label: 'Lost',
  value: 'LOST'
}];

export function RegisterEquipmentModal({
  isOpen,
  onClose,
  onSubmit
}: RegisterEquipmentModalProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      qrCode: formData.get('qrCode') as string,
      serialNumber: formData.get('serialNumber') as string,
      equipmentModelId: formData.get('equipmentModelId') as string,
      status: formData.get('status') as EquipmentStatus,
      areaId: formData.get('areaId') as string
    });
    e.currentTarget.reset();
    onClose();
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
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white">
                  
                    <option value="" disabled selected>
                      Select a model...
                    </option>
                    {MOCK_MODELS.map((m) =>
                  <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                  )}
                  </select>
                </div>

                {/* QR Code + Serial Number row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                    htmlFor="equip-qr"
                    className="block text-sm font-medium text-stone-700">
                    
                      QR Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                    type="text"
                    id="equip-qr"
                    name="qrCode"
                    required
                    placeholder="e.g. QR-00011"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder-stone-400" />
                  
                  </div>

                  <div className="space-y-2">
                    <label
                    htmlFor="equip-serial"
                    className="block text-sm font-medium text-stone-700">
                    
                      Serial Number
                    </label>
                    <input
                    type="text"
                    id="equip-serial"
                    name="serialNumber"
                    placeholder="e.g. SN-2026-A011"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder-stone-400" />
                  
                  </div>
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white">
                    
                      <option value="" disabled selected>
                        Select area...
                      </option>
                      {MOCK_AREAS.map((a) =>
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
                className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
                
                  Cancel
                </button>
                <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
                
                  Register Equipment
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}