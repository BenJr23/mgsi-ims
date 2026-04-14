"use client";

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import Link from 'next/link';

import { signOutAction } from '@/app/_actions/auth';
import { useRouter } from 'next/navigation';

function buildMockSuggestions(query: string): string[] {
  const q = query.trim();
  if (!q) {
    return [];
  }

  const suggestions = [
    q,
    `${q} sku`,
    `${q} equipment model`,
    `${q} low stock`,
    `${q} inventory report`,
    `${q} branch area`,
    `${q} latest updates`,
    `${q} analytics`,
  ];

  return Array.from(new Set(suggestions)).slice(0, 8);
}

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

  const suggestions = buildMockSuggestions(searchQuery);
  const showSearchResults = isSearchOpen && searchQuery.trim().length > 0;

  return (
    <header className="sticky top-0 z-30 box-border border-b border-stone-200 bg-white/95 backdrop-blur-sm">
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
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-4">
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