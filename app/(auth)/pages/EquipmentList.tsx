import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import {
  QrCodeIcon,
  SearchIcon,
  PlusIcon,
  FilterIcon,
  DownloadIcon,
  MoreVerticalIcon,
  CheckCircle2Icon,
  WrenchIcon,
  ArchiveIcon,
  AlertTriangleIcon } from
'lucide-react';
import { motion } from 'framer-motion';
type EquipmentStatus = 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED' | 'LOST';
interface EquipmentItem {
  id: string;
  qrCode: string;
  serialNumber: string | null;
  modelName: string;
  modelType: string;
  status: EquipmentStatus;
  areaName: string;
  branchName: string;
  createdBy: string;
  createdAt: string;
}
const STATUS_TABS: {
  label: string;
  value: EquipmentStatus | 'ALL';
}[] = [
{
  label: 'All',
  value: 'ALL'
},
{
  label: 'Available',
  value: 'AVAILABLE'
},
{
  label: 'Maintenance',
  value: 'MAINTENANCE'
},
{
  label: 'Retired',
  value: 'RETIRED'
},
{
  label: 'Lost',
  value: 'LOST'
}];

const EQUIPMENT: EquipmentItem[] = [
{
  id: '1',
  qrCode: 'QR-00001',
  serialNumber: 'SN-2026-A001',
  modelName: 'Standing Desk Pro',
  modelType: 'Furniture',
  status: 'AVAILABLE',
  areaName: 'Open Office',
  branchName: 'Main HQ',
  createdBy: 'Jane Doe',
  createdAt: 'Jan 12, 2026'
},
{
  id: '2',
  qrCode: 'QR-00002',
  serialNumber: 'SN-2026-A002',
  modelName: 'Dell UltraSharp 27"',
  modelType: 'Electronics',
  status: 'AVAILABLE',
  areaName: 'Open Office',
  branchName: 'Main HQ',
  createdBy: 'Alex Rivera',
  createdAt: 'Jan 16, 2026'
},
{
  id: '3',
  qrCode: 'QR-00003',
  serialNumber: 'SN-2026-A003',
  modelName: 'Ergonomic Office Chair',
  modelType: 'Furniture',
  status: 'MAINTENANCE',
  areaName: 'Conference Room A',
  branchName: 'Main HQ',
  createdBy: 'Jane Doe',
  createdAt: 'Jan 24, 2026'
},
{
  id: '4',
  qrCode: 'QR-00004',
  serialNumber: 'SN-2026-A004',
  modelName: 'MacBook Pro 16"',
  modelType: 'Electronics',
  status: 'AVAILABLE',
  areaName: 'Back Office',
  branchName: 'Downtown',
  createdBy: 'Alex Rivera',
  createdAt: 'Feb 3, 2026'
},
{
  id: '5',
  qrCode: 'QR-00005',
  serialNumber: null,
  modelName: 'Commercial Coffee Machine',
  modelType: 'Appliance',
  status: 'AVAILABLE',
  areaName: 'Kitchen',
  branchName: 'Main HQ',
  createdBy: 'Maria Santos',
  createdAt: 'Feb 10, 2026'
},
{
  id: '6',
  qrCode: 'QR-00006',
  serialNumber: 'SN-2026-A006',
  modelName: 'Cordless Drill Kit',
  modelType: 'Tool',
  status: 'LOST',
  areaName: 'Loading Dock',
  branchName: 'East Side',
  createdBy: 'Robert Chang',
  createdAt: 'Feb 16, 2026'
},
{
  id: '7',
  qrCode: 'QR-00007',
  serialNumber: 'SN-2026-A007',
  modelName: 'Network Switch 48-Port',
  modelType: 'Electronics',
  status: 'AVAILABLE',
  areaName: 'Server Room',
  branchName: 'Main HQ',
  createdBy: 'Alex Rivera',
  createdAt: 'Mar 2, 2026'
},
{
  id: '8',
  qrCode: 'QR-00008',
  serialNumber: 'SN-2026-A008',
  modelName: 'Standing Desk Pro',
  modelType: 'Furniture',
  status: 'RETIRED',
  areaName: 'Sales Floor',
  branchName: 'Downtown',
  createdBy: 'Jane Doe',
  createdAt: 'Mar 5, 2026'
},
{
  id: '9',
  qrCode: 'QR-00009',
  serialNumber: 'SN-2026-A009',
  modelName: 'Mini Fridge',
  modelType: 'Appliance',
  status: 'AVAILABLE',
  areaName: 'Break Room',
  branchName: 'Downtown',
  createdBy: 'Maria Santos',
  createdAt: 'Mar 8, 2026'
},
{
  id: '10',
  qrCode: 'QR-00010',
  serialNumber: 'SN-2026-A010',
  modelName: 'Safety Toolkit',
  modelType: 'Tool',
  status: 'MAINTENANCE',
  areaName: 'Packing Station',
  branchName: 'East Side',
  createdBy: 'Robert Chang',
  createdAt: 'Mar 14, 2026'
}];

const METRICS = [
{
  name: 'Total Equipment',
  value: '370',
  icon: QrCodeIcon,
  color: 'text-stone-600',
  bg: 'bg-stone-100'
},
{
  name: 'Available',
  value: '312',
  icon: CheckCircle2Icon,
  color: 'text-emerald-600',
  bg: 'bg-emerald-100'
},
{
  name: 'In Maintenance',
  value: '41',
  icon: WrenchIcon,
  color: 'text-amber-600',
  bg: 'bg-amber-100'
},
{
  name: 'Lost / Retired',
  value: '17',
  icon: AlertTriangleIcon,
  color: 'text-rose-600',
  bg: 'bg-rose-100'
}];

function getStatusBadge(status: EquipmentStatus) {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'MAINTENANCE':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'RETIRED':
      return 'bg-stone-100 text-stone-600 border-stone-200';
    case 'LOST':
      return 'bg-rose-100 text-rose-800 border-rose-200';
  }
}
function getStatusIcon(status: EquipmentStatus) {
  switch (status) {
    case 'AVAILABLE':
      return CheckCircle2Icon;
    case 'MAINTENANCE':
      return WrenchIcon;
    case 'RETIRED':
      return ArchiveIcon;
    case 'LOST':
      return AlertTriangleIcon;
  }
}
function formatStatus(status: EquipmentStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
export function EquipmentList() {
  const [activeTab, setActiveTab] = useState<EquipmentStatus | 'ALL'>('ALL');
  const filtered =
  activeTab === 'ALL' ?
  EQUIPMENT :
  EQUIPMENT.filter((e) => e.status === activeTab);
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />

      <main className="flex-1 p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Equipment
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Track and manage individual equipment items
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
              <DownloadIcon className="w-4 h-4" />
              Export
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
              <PlusIcon className="w-4 h-4" aria-hidden="true" />
              Register Equipment
            </button>
          </div>
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
              {STATUS_TABS.map((tab) =>
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
                  placeholder="Search by QR, serial, model..."
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
                    
                    QR Code
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Model
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Serial No.
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Registered
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-100">
                {filtered.map((item) => {
                  const StatusIcon = getStatusIcon(item.status);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-stone-50/80 transition-colors group">
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <QrCodeIcon className="w-4 h-4 text-stone-400" />
                          <span className="text-sm font-mono font-medium text-stone-900">
                            {item.qrCode}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-stone-900">
                            {item.modelName}
                          </p>
                          <p className="text-xs text-stone-500">
                            {item.modelType}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-stone-500 font-mono">
                          {item.serialNumber || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}>
                          
                          <StatusIcon className="w-3 h-3" />
                          {formatStatus(item.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-stone-900">
                            {item.areaName}
                          </p>
                          <p className="text-xs text-stone-500">
                            {item.branchName}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-stone-500">
                            {item.createdAt}
                          </p>
                          <p className="text-xs text-stone-400">
                            {item.createdBy}
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