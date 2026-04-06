import React from 'react';
import {
  LayoutDashboardIcon,
  PackageIcon,
  ScanLineIcon,
  ShoppingCartIcon,
  TruckIcon,
  BarChart3Icon,
  SettingsIcon,
  ActivityIcon } from
'lucide-react';
const NAV_ITEMS = [
{
  name: 'Dashboard',
  icon: LayoutDashboardIcon
},
{
  name: 'Products',
  icon: PackageIcon
},
{
  name: 'Stock Scanner',
  icon: ScanLineIcon
},
{
  name: 'Orders',
  icon: ShoppingCartIcon
},
{
  name: 'Suppliers',
  icon: TruckIcon
},
{
  name: 'Reports',
  icon: BarChart3Icon
},
{
  name: 'Settings',
  icon: SettingsIcon
}];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}
export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <>
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex-col z-20">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white">
            <div className="bg-amber-500 p-1.5 rounded-md">
              <ActivityIcon
                className="w-5 h-5 text-slate-900"
                aria-hidden="true" />

            </div>
            <span className="text-lg font-semibold tracking-wide">
              StockPulse
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto py-6 px-3 space-y-1"
          aria-label="Sidebar Navigation">

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.name;
            return (
              <button
                key={item.name}
                onClick={() => onNavigate(item.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-slate-800 text-white relative' : 'hover:bg-slate-800/50 hover:text-white'}`}
                aria-current={isActive ? 'page' : undefined}>

                {isActive &&
                <div
                  className="absolute left-0 top-2 bottom-2 w-1 bg-amber-500 rounded-r-full"
                  aria-hidden="true" />

                }
                <Icon
                  className={`w-5 h-5 ${isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-300'}`}
                  aria-hidden="true" />

                <span className="font-medium text-sm">{item.name}</span>
              </button>);

          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-800 transition-colors text-left">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-600">
              <span className="text-sm font-medium text-white">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Jane Doe</p>
              <p className="text-xs text-slate-400 truncate">Store Manager</p>
            </div>
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80" aria-label="Mobile Navigation">
        <div className="grid grid-cols-4 gap-0.5 px-1 py-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.name;
            return (
              <button
                key={`mobile-${item.name}`}
                onClick={() => onNavigate(item.name)}
                className={`min-h-14 rounded-lg px-1 py-1 text-[11px] font-medium transition-colors flex flex-col items-center justify-center gap-1 ${isActive ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:bg-stone-100'}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.name}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span className="leading-none text-center">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

    </>);

}