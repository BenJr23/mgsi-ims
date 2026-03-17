import React from 'react';
import { TopBar } from '../components/TopBar';
import { MetricsCards } from '../components/MetricsCards';
import { InventoryTable } from '../components/InventoryTable';
export function Dashboard() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return (
    <div className="flex flex-col min-h-full w-full">
      <TopBar />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-stone-500 mt-1">{today}</p>
        </div>

        {/* Metrics Section */}
        <section aria-label="Key Performance Indicators">
          <MetricsCards />
        </section>

        {/* Main Table Section */}
        <section aria-label="Inventory Data">
          <InventoryTable />
        </section>
      </main>
    </div>);

}