import React from 'react';
import { SearchIcon, BellIcon } from 'lucide-react';
export function TopBar() {
  return (
    <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-8 sticky top-0 z-10">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon
              className="h-4 w-4 text-stone-400 group-focus-within:text-amber-500 transition-colors"
              aria-hidden="true" />
            
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-stone-200 rounded-lg leading-5 bg-stone-50 text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 sm:text-sm transition-all"
            placeholder="Search products, SKUs..."
            aria-label="Search inventory" />
          
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-5 ml-4">
        <button
          type="button"
          className="relative p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
          aria-label="View notifications">
          
          <span
            className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white"
            aria-hidden="true" />
          
          <BellIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="h-8 w-px bg-stone-200" aria-hidden="true" />

        <button
          type="button"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label="User menu">
          
          <img
            className="h-8 w-8 rounded-full object-cover border border-stone-200 bg-stone-100"
            src="https://ui-avatars.com/api/?name=Jane+Doe&background=f5f5f4&color=1c1917"
            alt="User avatar" />
          
        </button>
      </div>
    </header>);

}