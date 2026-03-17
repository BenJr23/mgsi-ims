import React from 'react';
import { TopBar } from '../components/TopBar';
import {
  ShoppingCartIcon,
  ClockIcon,
  TruckIcon,
  DollarSignIcon,
  DownloadIcon,
  MoreVerticalIcon } from
'lucide-react';
import { motion } from 'framer-motion';
const METRICS = [
{
  name: 'Total Orders',
  value: '1,284',
  icon: ShoppingCartIcon,
  color: 'text-blue-600',
  bg: 'bg-blue-100'
},
{
  name: 'Pending',
  value: '47',
  icon: ClockIcon,
  color: 'text-amber-600',
  bg: 'bg-amber-100'
},
{
  name: 'Shipped Today',
  value: '23',
  icon: TruckIcon,
  color: 'text-indigo-600',
  bg: 'bg-indigo-100'
},
{
  name: 'Monthly Revenue',
  value: '$84.2K',
  icon: DollarSignIcon,
  color: 'text-emerald-600',
  bg: 'bg-emerald-100'
}];

const TABS = [
'All',
'Pending',
'Processing',
'Shipped',
'Delivered',
'Cancelled'];

const ORDERS = [
{
  id: '#ORD-4821',
  customer: 'Sarah Mitchell',
  date: 'Mar 14, 2026',
  items: '3 items',
  total: '$142.97',
  status: 'Shipped'
},
{
  id: '#ORD-4820',
  customer: 'James Wilson',
  date: 'Mar 14, 2026',
  items: '1 item',
  total: '$79.99',
  status: 'Processing'
},
{
  id: '#ORD-4819',
  customer: 'Emily Chen',
  date: 'Mar 13, 2026',
  items: '5 items',
  total: '$234.50',
  status: 'Delivered'
},
{
  id: '#ORD-4818',
  customer: 'Michael Brown',
  date: 'Mar 13, 2026',
  items: '2 items',
  total: '$54.98',
  status: 'Pending'
},
{
  id: '#ORD-4817',
  customer: 'Lisa Anderson',
  date: 'Mar 12, 2026',
  items: '1 item',
  total: '$89.99',
  status: 'Shipped'
},
{
  id: '#ORD-4816',
  customer: 'David Kim',
  date: 'Mar 12, 2026',
  items: '4 items',
  total: '$167.96',
  status: 'Delivered'
},
{
  id: '#ORD-4815',
  customer: 'Rachel Torres',
  date: 'Mar 11, 2026',
  items: '2 items',
  total: '$44.98',
  status: 'Cancelled'
},
{
  id: '#ORD-4814',
  customer: 'Tom Harris',
  date: 'Mar 11, 2026',
  items: '3 items',
  total: '$109.97',
  status: 'Pending'
}];

function getStatusStyles(status: string) {
  switch (status) {
    case 'Pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Processing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Shipped':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'Delivered':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Cancelled':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-stone-100 text-stone-800 border-stone-200';
  }
}
export function Orders() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />

      <main className="flex-1 p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Orders
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Track and manage customer orders
            </p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
            <DownloadIcon className="w-4 h-4" aria-hidden="true" />
            Export Orders
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

        {/* Orders Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="border-b border-stone-200 px-6 pt-4 flex overflow-x-auto hide-scrollbar">
            {TABS.map((tab, i) =>
            <button
              key={tab}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${i === 0 ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'}`}>
              
                {tab}
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Order ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Customer
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Items
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-100">
                {ORDERS.map((order) =>
                <tr
                  key={order.id}
                  className="hover:bg-stone-50/80 transition-colors group">
                  
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                      {order.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                      {order.items}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                      {order.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(order.status)}`}>
                      
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-stone-400 hover:text-stone-600 p-1 rounded-md hover:bg-stone-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <MoreVerticalIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>);

}