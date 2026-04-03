import React, { Component } from 'react';
import { TopBar } from '../components/TopBar';
import {
  UsersIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserPlusIcon,
  SearchIcon,
  FilterIcon,
  PlusIcon,
  MoreVerticalIcon } from
'lucide-react';
import { motion } from 'framer-motion';
const METRICS = [
{
  name: 'Total Users',
  value: '24',
  icon: UsersIcon,
  color: 'text-stone-600',
  bg: 'bg-stone-100'
},
{
  name: 'Verified',
  value: '21',
  icon: ShieldCheckIcon,
  color: 'text-emerald-600',
  bg: 'bg-emerald-100'
},
{
  name: 'Pending Verification',
  value: '3',
  icon: ClockIcon,
  color: 'text-amber-600',
  bg: 'bg-amber-100'
},
{
  name: 'New This Month',
  value: '5',
  icon: UserPlusIcon,
  color: 'text-blue-600',
  bg: 'bg-blue-100'
}];

const USERS = [
{
  id: '1',
  name: 'Jane Doe',
  email: 'jane@stockpulse.com',
  role: 'Super Admin',
  status: 'Verified',
  created: 'Jan 15, 2026',
  lastActive: '2 min ago'
},
{
  id: '2',
  name: 'Alex Rivera',
  email: 'alex@techflow.com',
  role: 'Admin',
  status: 'Verified',
  created: 'Feb 3, 2026',
  lastActive: '1h ago'
},
{
  id: '3',
  name: 'Maria Santos',
  email: 'maria@greenleaf.com',
  role: 'Manager',
  status: 'Verified',
  created: 'Feb 10, 2026',
  lastActive: '3h ago'
},
{
  id: '4',
  name: 'Robert Chang',
  email: 'robert@steelcraft.com',
  role: 'Manager',
  status: 'Verified',
  created: 'Feb 18, 2026',
  lastActive: '1d ago'
},
{
  id: '5',
  name: 'Sophie Laurent',
  email: 'sophie@novatech.com',
  role: 'Viewer',
  status: 'Pending',
  created: 'Mar 1, 2026',
  lastActive: 'Never'
},
{
  id: '6',
  name: 'Daniel Okafor',
  email: 'daniel@homebasics.com',
  role: 'Manager',
  status: 'Verified',
  created: 'Mar 5, 2026',
  lastActive: '5h ago'
},
{
  id: '7',
  name: 'Jennifer Wu',
  email: 'jennifer@pacificfw.com',
  role: 'Viewer',
  status: 'Verified',
  created: 'Mar 12, 2026',
  lastActive: '2d ago'
},
{
  id: '8',
  name: 'Tom Harris',
  email: 'tom@example.com',
  role: 'Viewer',
  status: 'Pending',
  created: 'Mar 20, 2026',
  lastActive: 'Never'
}];

function getRoleBadge(role: string) {
  switch (role) {
    case 'Super Admin':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Admin':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Manager':
      return 'bg-stone-100 text-stone-800 border-stone-200';
    case 'Viewer':
      return 'bg-stone-100 text-stone-600 border-stone-200';
    default:
      return 'bg-stone-100 text-stone-600 border-stone-200';
  }
}
export function UserManagement() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />

      <main className="flex-1 p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              User Management
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Manage accounts and permissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full sm:w-64 pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white shadow-sm" />
              
            </div>
            <button className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
              <FilterIcon className="w-4 h-4" />
              All Roles
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
              <PlusIcon className="w-4 h-4" />
              Add User
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

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Created
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    
                    Last Active
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-100">
                {USERS.map((user) =>
                <tr
                  key={user.id}
                  className="hover:bg-stone-50/80 transition-colors group">
                  
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                        className="h-8 w-8 rounded-full border border-stone-200 bg-stone-100"
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f5f5f4&color=1c1917&size=32`}
                        alt={user.name} />
                      
                        <div className="ml-3">
                          <p className="text-sm font-medium text-stone-900">
                            {user.name}
                          </p>
                          <p className="text-sm text-stone-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                      
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.status === 'Verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                      
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                      {user.created}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                      {user.lastActive}
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