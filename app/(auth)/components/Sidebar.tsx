"use client";

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboardIcon,
  BoxIcon,
  QrCodeIcon,
  ScanLineIcon,
  BarChart3Icon,
  Building2Icon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';

type NavItem = {
  name: string;
  icon: LucideIcon;
  href: string;
};

const MAIN_NAV_ITEMS = [
{
  name: 'Dashboard',
  icon: LayoutDashboardIcon,
  href: '/dashboard',
},
{
  name: 'Equipment Models',
  icon: BoxIcon,
  href: '/equipment-models',
},
{
  name: 'Equipment List',
  icon: QrCodeIcon,
  href: '/equipment',
},
{
  name: 'Stock Scanner',
  icon: ScanLineIcon,
  href: '/stock-adjust',
},
{
  name: 'Reports',
  icon: BarChart3Icon,
  href: '/reports',
}] satisfies NavItem[];

const ADMIN_NAV_ITEMS = [
{
  name: 'Branches & Areas',
  icon: Building2Icon,
  href: '/branches-areas',
},
{
  name: 'User Management',
  icon: UsersIcon,
  href: '/user-management',
},
{
  name: 'Audit Logs',
  icon: UsersIcon,
  href: '/audit-logs',
}] satisfies NavItem[];

const NAV_ITEMS = [...MAIN_NAV_ITEMS, ...ADMIN_NAV_ITEMS];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const pendingNavigationRef = useRef<{
    from: string;
    to: string;
    startedAt: number;
  } | null>(null);

  useEffect(() => {
    for (const item of NAV_ITEMS) {
      router.prefetch(item.href);
    }
  }, [router]);

  useEffect(() => {
    const pendingNavigation = pendingNavigationRef.current;

    if (!pendingNavigation) {
      return;
    }

    const normalizedPathname = pathname.endsWith('/') && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;
    const normalizedTarget = pendingNavigation.to.endsWith('/') && pendingNavigation.to.length > 1
      ? pendingNavigation.to.slice(0, -1)
      : pendingNavigation.to;

    if (normalizedPathname !== normalizedTarget) {
      return;
    }

    const elapsedMs = performance.now() - pendingNavigation.startedAt;

    console.log(
      `[NAV_DELAY] ${pendingNavigation.from} -> ${pendingNavigation.to}: ${elapsedMs.toFixed(1)}ms`,
    );

    pendingNavigationRef.current = null;
  }, [pathname]);

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 box-border bg-white text-stone-700 flex-col z-20 border-r border-stone-200">
      {/* Logo Area */}
      <div className="h-17.5 box-border flex items-center px-5 border-b border-stone-200">
        <Image
          src="/logo/GWlogo.webp"
          alt="GreatWork"
          width={220}
          height={54}
          className="h-9 w-full object-contain"
          priority
        />
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto py-6 px-3 space-y-1"
        aria-label="Sidebar Navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch
              onMouseEnter={() => router.prefetch(item.href)}
              onClick={() => {
                pendingNavigationRef.current = {
                  from: pathname,
                  to: item.href,
                  startedAt: performance.now(),
                };
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-[#8B1D1D]/10 text-[#8B1D1D] relative' : 'hover:bg-stone-100 hover:text-stone-900'}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive ? (
              <div
                className="absolute left-0 top-2 bottom-2 w-1 bg-[#8B1D1D] rounded-r-full"
                aria-hidden="true"
              />
              ) : null}
              <Icon
                className={`w-5 h-5 ${isActive ? 'text-[#8B1D1D]' : 'text-stone-500 group-hover:text-stone-700'}`}
                aria-hidden="true"
              />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      {/* <div className="p-4 border-t border-stone-200">
        <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-stone-100 transition-colors text-left">
          <div className="w-9 h-9 rounded-full bg-[#8B1D1D]/10 flex items-center justify-center shrink-0 border border-[#8B1D1D]/20">
            <span className="text-sm font-medium text-[#8B1D1D]">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-900 truncate">Jane Doe</p>
            <p className="text-xs text-gray-600 truncate">Store Manager</p>
          </div>
        </button>
      </div> */}
    </aside>
  );
}