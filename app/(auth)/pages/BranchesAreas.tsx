import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import {
  Building2Icon,
  DoorOpenIcon,
  PackageIcon,
  SearchIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Edit2Icon,
  Trash2Icon } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const METRICS = [
{
  name: 'Total Branches',
  value: '4',
  icon: Building2Icon,
  color: 'text-stone-600',
  bg: 'bg-stone-100'
},
{
  name: 'Total Areas',
  value: '18',
  icon: DoorOpenIcon,
  color: 'text-blue-600',
  bg: 'bg-blue-100'
},
{
  name: 'Total Equipment',
  value: '2,847',
  icon: PackageIcon,
  color: 'text-emerald-600',
  bg: 'bg-emerald-100'
}];

const BRANCHES = [
{
  id: 'b1',
  name: 'Main Headquarters',
  code: 'BLD-001',
  address: '1234 Commerce Blvd, Portland, OR',
  areaCount: 6,
  equipCount: 1205,
  areas: [
  {
    id: 'a1',
    name: 'Reception',
    code: 'RM-101',
    equipCount: 12
  },
  {
    id: 'a2',
    name: 'Open Office',
    code: 'RM-102',
    equipCount: 89
  },
  {
    id: 'a3',
    name: 'Server Room',
    code: 'RM-103',
    equipCount: 34
  },
  {
    id: 'a4',
    name: 'Conference Room A',
    code: 'RM-104',
    equipCount: 18
  },
  {
    id: 'a5',
    name: 'Kitchen',
    code: 'RM-105',
    equipCount: 15
  },
  {
    id: 'a6',
    name: 'Storage',
    code: 'RM-106',
    equipCount: 45
  }]

},
{
  id: 'b2',
  name: 'Downtown Branch',
  code: 'BLD-002',
  address: '567 Market St, Portland, OR',
  areaCount: 4,
  equipCount: 892,
  areas: [
  {
    id: 'a7',
    name: 'Sales Floor',
    code: 'RM-201',
    equipCount: 67
  },
  {
    id: 'a8',
    name: 'Back Office',
    code: 'RM-202',
    equipCount: 23
  },
  {
    id: 'a9',
    name: 'Break Room',
    code: 'RM-203',
    equipCount: 8
  },
  {
    id: 'a10',
    name: 'Warehouse',
    code: 'RM-204',
    equipCount: 156
  }]

},
{
  id: 'b3',
  name: 'East Side Warehouse',
  code: 'BLD-003',
  address: '890 Industrial Ave, Portland, OR',
  areaCount: 5,
  equipCount: 534,
  areas: [
  {
    id: 'a11',
    name: 'Loading Dock',
    code: 'RM-301',
    equipCount: 12
  },
  {
    id: 'a12',
    name: 'Storage Zone A',
    code: 'RM-302',
    equipCount: 234
  },
  {
    id: 'a13',
    name: 'Storage Zone B',
    code: 'RM-303',
    equipCount: 189
  },
  {
    id: 'a14',
    name: 'Packing Station',
    code: 'RM-304',
    equipCount: 45
  },
  {
    id: 'a15',
    name: 'Office',
    code: 'RM-305',
    equipCount: 8
  }]

},
{
  id: 'b4',
  name: 'South Distribution Center',
  code: 'BLD-004',
  address: '2100 Logistics Pkwy, Portland, OR',
  areaCount: 3,
  equipCount: 216,
  areas: [
  {
    id: 'a16',
    name: 'Receiving',
    code: 'RM-401',
    equipCount: 34
  },
  {
    id: 'a17',
    name: 'Sorting',
    code: 'RM-402',
    equipCount: 112
  },
  {
    id: 'a18',
    name: 'Dispatch',
    code: 'RM-403',
    equipCount: 70
  }]

}];

export function BranchesAreas() {
  const [expandedBranch, setExpandedBranch] = useState<string | null>('b1');
  const toggleBranch = (id: string) => {
    setExpandedBranch(expandedBranch === id ? null : id);
  };
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />

      <main className="flex-1 p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Branches & Areas
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Manage your branches, rooms, and locations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search branches..."
                className="w-full sm:w-64 pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white shadow-sm" />
              
            </div>
            <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
              <PlusIcon className="w-4 h-4" />
              Add Branch
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {METRICS.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.name}
                initial={{
                  opacity: 0,
                  y: 20
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: i * 0.1
                }}
                className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 flex items-center gap-4">
                
                <div className={`p-3 rounded-full ${metric.bg} flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-500">
                    {metric.name}
                  </p>
                  <p className="text-xl font-bold text-stone-900 mt-0.5">
                    {metric.value}
                  </p>
                </div>
              </motion.div>);

          })}
        </div>

        {/* Branches List */}
        <div className="space-y-4">
          {BRANCHES.map((branch, i) => {
            const isExpanded = expandedBranch === branch.id;
            return (
              <motion.div
                key={branch.id}
                initial={{
                  opacity: 0,
                  y: 20
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: i * 0.1
                }}
                className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                
                {/* Branch Header (Clickable) */}
                <button
                  onClick={() => toggleBranch(branch.id)}
                  className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-stone-50 transition-colors text-left gap-4">
                  
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="p-2.5 bg-stone-100 rounded-lg text-stone-500">
                      <Building2Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-stone-900">
                          {branch.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-xs font-mono font-medium rounded border border-stone-200">
                          {branch.code}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500">{branch.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 ml-14 sm:ml-0">
                    <div className="flex items-center gap-4 text-sm text-stone-500">
                      <span className="flex items-center gap-1.5">
                        <DoorOpenIcon className="w-4 h-4" /> {branch.areaCount}{' '}
                        areas
                      </span>
                      <span className="flex items-center gap-1.5">
                        <PackageIcon className="w-4 h-4" />{' '}
                        {branch.equipCount.toLocaleString()} equip
                      </span>
                    </div>
                    <div className="text-stone-400">
                      {isExpanded ?
                      <ChevronUpIcon className="w-5 h-5" /> :

                      <ChevronDownIcon className="w-5 h-5" />
                      }
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded &&
                  <motion.div
                    initial={{
                      height: 0,
                      opacity: 0
                    }}
                    animate={{
                      height: 'auto',
                      opacity: 1
                    }}
                    exit={{
                      height: 0,
                      opacity: 0
                    }}
                    transition={{
                      duration: 0.2
                    }}
                    className="border-t border-stone-200 bg-stone-50/50">
                    
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold text-stone-900">
                            Areas in {branch.name}
                          </h4>
                          <button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 transition-colors shadow-sm">
                            <PlusIcon className="w-3.5 h-3.5" />
                            Add Area
                          </button>
                        </div>

                        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-stone-200">
                            <thead className="bg-stone-50">
                              <tr>
                                <th
                                scope="col"
                                className="px-4 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                
                                  Room Name
                                </th>
                                <th
                                scope="col"
                                className="px-4 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                
                                  Room Code
                                </th>
                                <th
                                scope="col"
                                className="px-4 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                
                                  Equipment Count
                                </th>
                                <th
                                scope="col"
                                className="relative px-4 py-2.5">
                                
                                  <span className="sr-only">Actions</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {branch.areas.map((area) => {
                              const maxEquip = 300; // arbitrary max for progress bar
                              const percentage = Math.min(
                                100,
                                Math.max(
                                  0,
                                  area.equipCount / maxEquip * 100
                                )
                              );
                              return (
                                <tr
                                  key={area.id}
                                  className="hover:bg-stone-50/80 transition-colors group">
                                  
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-stone-900">
                                      {area.name}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-stone-500 font-mono">
                                      {area.code}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm text-stone-600 w-8">
                                          {area.equipCount}
                                        </span>
                                        <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                          <div
                                          className="h-full bg-emerald-500 rounded-full"
                                          style={{
                                            width: `${percentage}%`
                                          }} />
                                        
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                        className="text-stone-400 hover:text-blue-600 p-1 rounded transition-colors"
                                        aria-label="Edit Area">
                                        
                                          <Edit2Icon className="w-4 h-4" />
                                        </button>
                                        <button
                                        className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors"
                                        aria-label="Delete Area">
                                        
                                          <Trash2Icon className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>);

                            })}
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-4 pt-4 border-t border-stone-200">
                          <button className="text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors">
                            Edit Branch
                          </button>
                          <button className="text-xs font-medium text-rose-500 hover:text-rose-700 transition-colors">
                            Delete Branch
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  }
                </AnimatePresence>
              </motion.div>);

          })}
        </div>
      </main>
    </div>);

}