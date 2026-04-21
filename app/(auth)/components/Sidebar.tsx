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
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 box-border flex-col z-20 bg-[#dfe3ea] text-black overflow-hidden">
      {/* Logo Area */}
      <div className="h-17.5 box-border flex items-center px-5 border-b border-[#cdd3dd]">
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
        className="flex-1 overflow-y-auto overflow-x-hidden py-6 pl-3 pr-0 space-y-1"
        aria-label="Sidebar Navigation"
      >
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const previousItem = NAV_ITEMS[index - 1];
          const nextItem = NAV_ITEMS[index + 1];
          const isPreviousActive = previousItem
            ? pathname === previousItem.href || pathname.startsWith(`${previousItem.href}/`)
            : false;
          const isNextActive = nextItem
            ? pathname === nextItem.href || pathname.startsWith(`${nextItem.href}/`)
            : false;
          const itemClassName = isActive
            ? "mr-[-1px] bg-white text-black rounded-l-[12px] rounded-r-none isolation-isolate before:content-[''] before:absolute before:right-[-1px] before:-top-4 before:w-4 before:h-4 before:bg-[#dfe3ea] before:rounded-br-2xl before:[box-shadow:6px_6px_0_6px_#ffffff] before:pointer-events-none before:-z-10 after:content-[''] after:absolute after:right-[-1px] after:-bottom-4 after:w-4 after:h-4 after:bg-[#dfe3ea] after:rounded-tr-2xl after:[box-shadow:6px_-6px_0_6px_#ffffff] after:pointer-events-none after:-z-10"
            : 'text-black rounded-xl';

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
              className={`group relative flex w-full items-center gap-3 px-3 pr-4 py-2.5 transition-colors duration-300 ${itemClassName}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {!isActive ? (
                <>
                  <span
                    className="pointer-events-none absolute inset-y-0 right-[-1px] left-0 rounded-l-[12px] rounded-r-none bg-white origin-right scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
                    aria-hidden="true"
                  />
                  {!isPreviousActive ? (
                    <span
                      className="pointer-events-none hidden group-hover:block absolute right-[-1px] -top-4 h-4 w-4 bg-[#dfe3ea] rounded-br-2xl [box-shadow:6px_6px_0_6px_#ffffff]"
                      aria-hidden="true"
                    />
                  ) : null}
                  {!isNextActive ? (
                    <span
                      className="pointer-events-none hidden group-hover:block absolute right-[-1px] -bottom-4 h-4 w-4 bg-[#dfe3ea] rounded-tr-2xl [box-shadow:6px_-6px_0_6px_#ffffff]"
                      aria-hidden="true"
                    />
                  ) : null}
                </>
              ) : null}
              {isActive ? (
              <div
                className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-[#8b1d1d]"
                aria-hidden="true"
              />
              ) : null}
              <Icon
                className={`relative z-10 w-5 h-5 ${isActive ? 'text-black' : 'text-[#4b5565] group-hover:text-black'}`}
                aria-hidden="true"
              />
              <span className="relative z-10 font-medium text-sm">{item.name}</span>
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