import React from 'react';
import { XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface AddAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchName: string;
  onSubmit: (data: {roomName: string;roomCode: string;}) => void;
}
export function AddAreaModal({
  isOpen,
  onClose,
  branchName,
  onSubmit
}: AddAreaModalProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      roomName: formData.get('roomName') as string,
      roomCode: formData.get('roomCode') as string
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
          className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-area-title">
          
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <div>
                <h2
                id="add-area-title"
                className="text-lg font-semibold text-stone-900">
                
                  Add New Area
                </h2>
                <p className="text-sm text-stone-500 mt-0.5">
                  Adding to{' '}
                  <span className="font-medium text-stone-700">
                    {branchName}
                  </span>
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
                <div className="space-y-2">
                  <label
                  htmlFor="roomName"
                  className="block text-sm font-medium text-stone-700">
                  
                    Room Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                  type="text"
                  id="roomName"
                  name="roomName"
                  required
                  placeholder="e.g. Conference Room B"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder-stone-400" />
                
                </div>

                <div className="space-y-2">
                  <label
                  htmlFor="roomCode"
                  className="block text-sm font-medium text-stone-700">
                  
                    Room Code
                  </label>
                  <input
                  type="text"
                  id="roomCode"
                  name="roomCode"
                  placeholder="e.g. RM-107"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder-stone-400" />
                
                  <p className="text-xs text-stone-400">
                    Optional. A unique identifier for this room within the
                    branch.
                  </p>
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
                
                  Add Area
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}