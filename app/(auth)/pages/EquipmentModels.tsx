import React, { useState, memo } from 'react';
import { TopBar } from '../components/TopBar';
import {
  BoxIcon,
  SearchIcon,
  PlusIcon,
  FilterIcon,
  MoreVerticalIcon,
  CpuIcon,
  ArmchairIcon,
  WrenchIcon,
  ZapIcon,
  CircleDotIcon } from
'lucide-react';
import { motion } from 'framer-motion';
type EquipmentType =
'FURNITURE' |
'ELECTRONICS' |
'APPLIANCE' |
'TOOL' |
'OTHER';
interface EquipmentModel {
  id: string;
  name: string;
  description: string;
  sku: string | null;
  type: EquipmentType;
  price: string | null;
  createdBy: string;
  createdAt: string;
  unitCount: number;
}
const TYPE_TABS: {
  label: string;
  value: EquipmentType | 'ALL';
}[] = [
{
  label: 'All',
  value: 'ALL'
},
{
  label: 'Furniture',
  value: 'FURNITURE'
},
{
  label: 'Electronics',
  value: 'ELECTRONICS'
},
{
  label: 'Appliance',
  value: 'APPLIANCE'
},
{
  label: 'Tool',
  value: 'TOOL'
},
{
  label: 'Other',
  value: 'OTHER'
}];

const MODELS: EquipmentModel[] = [
{
  id: '1',
  name: 'Standing Desk Pro',
  description: 'Height-adjustable standing desk with memory presets',
  sku: 'MOD-1001',
  type: 'FURNITURE',
  price: '$549.00',
  createdBy: 'Jane Doe',
  createdAt: 'Jan 10, 2026',
  unitCount: 48
},
{
  id: '2',
  name: 'Dell UltraSharp 27"',
  description: '4K USB-C monitor with built-in KVM',
  sku: 'MOD-1002',
  type: 'ELECTRONICS',
  price: '$429.99',
  createdBy: 'Alex Rivera',
  createdAt: 'Jan 15, 2026',
  unitCount: 124
},
{
  id: '3',
  name: 'Ergonomic Office Chair',
  description: 'Mesh back with lumbar support and adjustable arms',
  sku: 'MOD-1003',
  type: 'FURNITURE',
  price: '$389.00',
  createdBy: 'Jane Doe',
  createdAt: 'Jan 22, 2026',
  unitCount: 67
},
{
  id: '4',
  name: 'MacBook Pro 16"',
  description: 'M3 Pro chip, 18GB RAM, 512GB SSD',
  sku: 'MOD-1004',
  type: 'ELECTRONICS',
  price: '$2,499.00',
  createdBy: 'Alex Rivera',
  createdAt: 'Feb 1, 2026',
  unitCount: 35
},
{
  id: '5',
  name: 'Commercial Coffee Machine',
  description: 'Automatic espresso machine with grinder',
  sku: 'MOD-1005',
  type: 'APPLIANCE',
  price: '$1,299.00',
  createdBy: 'Maria Santos',
  createdAt: 'Feb 8, 2026',
  unitCount: 6
},
{
  id: '6',
  name: 'Cordless Drill Kit',
  description: '20V MAX with 2 batteries and charger',
  sku: 'MOD-1006',
  type: 'TOOL',
  price: '$179.99',
  createdBy: 'Robert Chang',
  createdAt: 'Feb 14, 2026',
  unitCount: 18
},
{
  id: '7',
  name: 'Whiteboard 6x4ft',
  description: 'Magnetic dry-erase whiteboard with aluminum frame',
  sku: 'MOD-1007',
  type: 'OTHER',
  price: '$89.99',
  createdBy: 'Jane Doe',
  createdAt: 'Feb 20, 2026',
  unitCount: 22
},
{
  id: '8',
  name: 'Network Switch 48-Port',
  description: 'Managed PoE+ Gigabit Ethernet switch',
  sku: 'MOD-1008',
  type: 'ELECTRONICS',
  price: '$649.00',
  createdBy: 'Alex Rivera',
  createdAt: 'Mar 1, 2026',
  unitCount: 12
},
{
  id: '9',
  name: 'Mini Fridge',
  description: 'Compact 4.5 cu ft refrigerator for break rooms',
  sku: 'MOD-1009',
  type: 'APPLIANCE',
  price: '$219.00',
  createdBy: 'Maria Santos',
  createdAt: 'Mar 5, 2026',
  unitCount: 8
},
{
  id: '10',
  name: 'Safety Toolkit',
  description: 'Complete warehouse safety kit with PPE',
  sku: null,
  type: 'TOOL',
  price: '$124.50',
  createdBy: 'Robert Chang',
  createdAt: 'Mar 12, 2026',
  unitCount: 30
}];

const METRICS = [
{
  name: 'Total Models',
  value: '10',
  icon: BoxIcon,
  color: 'text-stone-600',
  bg: 'bg-stone-100'
},
{
  name: 'Furniture',
  value: '3',
  icon: ArmchairIcon,
  color: 'text-blue-600',
  bg: 'bg-blue-100'
},
{
  name: 'Electronics',
  value: '3',
  icon: CpuIcon,
  color: 'text-indigo-600',
  bg: 'bg-indigo-100'
},
{
  name: 'Total Units',
  value: '370',
  icon: BoxIcon,
  color: 'text-emerald-600',
  bg: 'bg-emerald-100'
}];

function getTypeIcon(type: EquipmentType) {
  switch (type) {
    case 'FURNITURE':
      return ArmchairIcon;
    case 'ELECTRONICS':
      return CpuIcon;
    case 'APPLIANCE':
      return ZapIcon;
    case 'TOOL':
      return WrenchIcon;
    case 'OTHER':
      return CircleDotIcon;
  }
}
function getTypeBadge(type: EquipmentType) {
  switch (type) {
    case 'FURNITURE':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ELECTRONICS':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'APPLIANCE':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'TOOL':
      return 'bg-stone-100 text-stone-800 border-stone-200';
    case 'OTHER':
      return 'bg-stone-100 text-stone-600 border-stone-200';
  }
}
export function EquipmentModels() {
  const [activeTab, setActiveTab] = useState<EquipmentType | 'ALL'>('ALL');
  const filtered =
  activeTab === 'ALL' ? MODELS : MODELS.filter((m) => m.type === activeTab);
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />

      <main className="flex-1 p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Equipment Models
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Manage your equipment catalog and templates
            </p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
            <PlusIcon className="w-4 h-4" aria-hidden="true" />
            Add Model
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
          {/* Tabs + Search */}
          <div className="p-4 sm:p-6 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex overflow-x-auto gap-1 hide-scrollbar">
              {TYPE_TABS.map((tab) =>
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.value ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'}`}>
                
                  {tab.label}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 lg:w-64">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search models..."
                  className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50" />
                
              </div>
              <button className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors">
                <FilterIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Model
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    SKU
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Units
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Created
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-100">
                {filtered.map((model) => {
                  const TypeIcon = getTypeIcon(model.type);
                  return (
                    <tr
                      key={model.id}
                      className="hover:bg-stone-50/80 transition-colors group">
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 bg-stone-100 rounded-lg border border-stone-200 flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-stone-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-stone-900">
                              {model.name}
                            </p>
                            <p className="text-xs text-stone-500 max-w-xs truncate">
                              {model.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-stone-500 font-mono">
                          {model.sku || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadge(model.type)}`}>
                          
                          {model.type.charAt(0) +
                          model.type.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                        {model.price || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-stone-600">
                          {model.unitCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-stone-500">
                            {model.createdAt}
                          </p>
                          <p className="text-xs text-stone-400">
                            {model.createdBy}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-stone-400 hover:text-stone-600 p-1 rounded-md hover:bg-stone-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <MoreVerticalIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>);

                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>);

}