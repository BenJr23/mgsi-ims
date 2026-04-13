"use client";

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { SearchIcon, BellIcon } from 'lucide-react';
import Link from 'next/link';

import { signOutAction } from '@/app/_actions/auth';
import { useRouter } from 'next/navigation';

export function TopBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (!dropdownRef.current) {
        setIsDropdownOpen(false);
      } else if (!dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }

      if (!searchRef.current) {
        setIsSearchOpen(false);
      } else if (!searchRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  function handleSignOut() {
    startTransition(async () => {
      const result = await signOutAction();

      if (result.ok) {
        setIsDropdownOpen(false);
        router.replace('/sign-in');
        router.refresh();
      }
    });
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setIsSearchOpen(true);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-17.5 w-full max-w-400 items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="min-w-0 flex-1" ref={searchRef}>
          <div
            className="relative group"
            role="combobox"
            aria-label="Inventory search"
            aria-expanded={isSearchOpen && searchQuery.trim().length > 0}
            aria-controls="topbar-search-results"
            aria-haspopup="listbox"
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon
                className="h-4 w-4 text-stone-400 group-focus-within:text-amber-500 transition-colors"
                aria-hidden="true"
              />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setIsSearchOpen(false);
                }
              }}
              className="block h-10 w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-3 text-sm leading-5 text-stone-900 placeholder-stone-400 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              placeholder="Search products, SKUs..."
              aria-label="Search inventory"
            />

            {isSearchOpen && searchQuery.trim().length > 0 ? (
              <div
                id="topbar-search-results"
                role="listbox"
                aria-label="Search suggestions"
                className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg"
              >
                <div className="border-b border-stone-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Suggestions
                </div>
                <div className="px-3 py-4 text-sm text-stone-500" role="option" aria-selected="false">
                  No results found
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-4">
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

          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
              aria-label="User menu"
              aria-expanded={isDropdownOpen}
              aria-haspopup="menu"
            >
              <img
                className="h-8 w-8 rounded-full border border-stone-200 bg-stone-100 object-cover"
                src="https://ui-avatars.com/api/?name=Jane+Doe&background=f5f5f4&color=1c1917"
                alt="User avatar"
              />
            </button>

            {isDropdownOpen ? (
              <div
                className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
                role="menu"
                aria-label="User menu options"
              >
                <Link
                  href="/profile"
                  className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
                  role="menuitem"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                  role="menuitem"
                  onClick={handleSignOut}
                  disabled={isPending}
                >
                  {isPending ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );

}