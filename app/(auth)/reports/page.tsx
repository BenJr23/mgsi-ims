import React from 'react';
import {
  CalendarIcon,
  TrendingUpIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon } from
'lucide-react';
import { motion } from 'framer-motion';
export default function ReportsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Reports & Analytics
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Insights into your inventory performance
            </p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
            <CalendarIcon className="w-4 h-4" aria-hidden="true" />
            Last 30 Days
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            
            <p className="text-sm font-medium text-stone-500 mb-1">
              Total Revenue
            </p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-bold text-stone-900">$124,500</h3>
              <span className="flex items-center text-sm font-medium text-emerald-600 mb-1">
                <ArrowUpRightIcon className="w-4 h-4 mr-1" /> 12.5%
              </span>
            </div>
          </motion.div>
          <motion.div
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: 0.1
            }}
            className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            
            <p className="text-sm font-medium text-stone-500 mb-1">
              Cost of Goods Sold
            </p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-bold text-stone-900">$48,200</h3>
              <span className="flex items-center text-sm font-medium text-rose-600 mb-1">
                <ArrowUpRightIcon className="w-4 h-4 mr-1" /> 4.2%
              </span>
            </div>
          </motion.div>
          <motion.div
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: 0.2
            }}
            className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            
            <p className="text-sm font-medium text-stone-500 mb-1">
              Gross Margin
            </p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-bold text-stone-900">61.3%</h3>
              <span className="flex items-center text-sm font-medium text-emerald-600 mb-1">
                <ArrowUpRightIcon className="w-4 h-4 mr-1" /> 2.1%
              </span>
            </div>
          </motion.div>
        </div>

        {/* Charts Area (Mocked with CSS) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: 0.3
            }}
            className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-semibold text-stone-900">Revenue Trend</h3>
              <TrendingUpIcon className="w-5 h-5 text-stone-400" />
            </div>
            <div className="h-64 flex items-end gap-2 sm:gap-4">
              {/* Mock Bar Chart */}
              {[40, 65, 45, 80, 55, 90, 75, 100, 85, 110, 95, 120].map(
                (height, i) =>
                <div
                  key={i}
                  className="flex-1 flex flex-col justify-end group">
                  
                    <div
                    className="w-full bg-amber-200 group-hover:bg-amber-400 rounded-t-sm transition-colors relative"
                    style={{
                      height: `${height}%`
                    }}>
                    
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity">
                        ${height}k
                      </div>
                    </div>
                  </div>

              )}
            </div>
            <div className="flex justify-between mt-4 text-xs text-stone-400 font-medium">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: 0.4
            }}
            className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            
            <h3 className="font-semibold text-stone-900 mb-6">
              Top Categories
            </h3>
            <div className="space-y-6">
              {[
              {
                name: 'Electronics',
                value: '45%',
                color: 'bg-blue-500'
              },
              {
                name: 'Apparel',
                value: '25%',
                color: 'bg-emerald-500'
              },
              {
                name: 'Kitchen',
                value: '20%',
                color: 'bg-amber-500'
              },
              {
                name: 'Footwear',
                value: '10%',
                color: 'bg-rose-500'
              }].
              map((cat) =>
              <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-stone-700">
                      {cat.name}
                    </span>
                    <span className="text-stone-500">{cat.value}</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                    className={`h-full ${cat.color} rounded-full`}
                    style={{
                      width: cat.value
                    }} />
                  
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>);

}