"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboardIcon,
  BoxIcon,
  QrCodeIcon,
  ScanLineIcon,
  BarChart3Icon,
  Building2Icon,
  UsersIcon,
  ActivityIcon,
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
}] satisfies NavItem[];

const NAV_ITEMS = [...MAIN_NAV_ITEMS, ...ADMIN_NAV_ITEMS];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex-col z-20">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white">
          <div className="bg-amber-500 p-1.5 rounded-md">
            <ActivityIcon className="w-5 h-5 text-slate-900" aria-hidden="true" />
          </div>
          <span className="text-lg font-semibold tracking-wide">StockPulse</span>
        </div>
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-slate-800 text-white relative' : 'hover:bg-slate-800/50 hover:text-white'}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive ? (
              <div
                className="absolute left-0 top-2 bottom-2 w-1 bg-amber-500 rounded-r-full"
                aria-hidden="true"
              />
              ) : null}
              <Icon
                className={`w-5 h-5 ${isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-300'}`}
                aria-hidden="true"
              />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-800 transition-colors text-left">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600">
            <span className="text-sm font-medium text-white">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Jane Doe</p>
            <p className="text-xs text-slate-400 truncate">Store Manager</p>
          </div>
        </button>
      </div>
    </aside>
  );
}