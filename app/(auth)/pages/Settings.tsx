import React from 'react';
import { TopBar } from '../components/TopBar';
import { motion } from 'framer-motion';
const SETTINGS_TABS = [
'General',
'Team & Permissions',
'Notifications',
'Billing',
'Integrations'];

export function Settings() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />

      <main className="flex-1 p-8 max-w-[1200px] mx-auto w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage your account and application preferences
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Settings Navigation */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
              {SETTINGS_TABS.map((tab, i) =>
              <button
                key={tab}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg text-left whitespace-nowrap transition-colors ${i === 0 ? 'bg-white text-amber-600 shadow-sm border border-stone-200' : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 border border-transparent'}`}>
                
                  {tab}
                </button>
              )}
            </nav>
          </aside>

          {/* Settings Content */}
          <motion.div
            initial={{
              opacity: 0,
              x: 20
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            className="flex-1 bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            
            <div className="p-6 border-b border-stone-200">
              <h2 className="text-lg font-semibold text-stone-900">
                General Information
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                Update your store details and primary configurations.
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="storeName"
                    className="block text-sm font-medium text-stone-700">
                    
                    Store Name
                  </label>
                  <input
                    type="text"
                    id="storeName"
                    defaultValue="StockPulse Demo Store"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
                  
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="contactEmail"
                    className="block text-sm font-medium text-stone-700">
                    
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    defaultValue="admin@stockpulse.demo"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
                  
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="currency"
                    className="block text-sm font-medium text-stone-700">
                    
                    Primary Currency
                  </label>
                  <select
                    id="currency"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white">
                    
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="timezone"
                    className="block text-sm font-medium text-stone-700">
                    
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white">
                    
                    <option>Pacific Time (PT)</option>
                    <option>Eastern Time (ET)</option>
                    <option>Coordinated Universal Time (UTC)</option>
                  </select>
                </div>
              </div>

              <hr className="border-stone-200" />

              <div>
                <h3 className="text-sm font-medium text-stone-900 mb-4">
                  Low Stock Threshold
                </h3>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    defaultValue="10"
                    className="w-24 px-3 py-2 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
                  
                  <span className="text-sm text-stone-500">
                    items remaining before triggering alert
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-stone-50 border-t border-stone-200 flex justify-end gap-3">
              <button className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
                Cancel
              </button>
              <button className="px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>);

}