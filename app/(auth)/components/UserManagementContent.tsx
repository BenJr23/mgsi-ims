"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
    UsersIcon,
    ShieldCheckIcon,
    ClockIcon,
    UserPlusIcon,
    SearchIcon,
    FilterIcon,
    PlusIcon,
    MoreVerticalIcon,
} from 'lucide-react';

import {
    fetchUserManagementAction,
    type UserManagementMetric,
    type UserManagementRow,
} from '@/app/_actions/user-management';

type RoleFilter = 'ALL' | 'Super Admin' | 'Admin' | 'Manager' | 'Viewer';

const METRIC_ICONS = [UsersIcon, ShieldCheckIcon, ClockIcon, UserPlusIcon] as const;
const METRIC_STYLES = [
    { color: 'text-stone-600', bg: 'bg-stone-100' },
    { color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { color: 'text-amber-600', bg: 'bg-amber-100' },
    { color: 'text-blue-600', bg: 'bg-blue-100' },
] as const;

function getRoleBadge(role: UserManagementRow['role']) {
    switch (role) {
        case 'Super Admin':
            return 'bg-violet-100 text-violet-800 border-violet-200';
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

export function UserManagementContent() {
    const [metrics, setMetrics] = useState<UserManagementMetric[]>([]);
    const [users, setUsers] = useState<UserManagementRow[]>([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadUserManagement() {
            const result = await fetchUserManagementAction();

            if (!isMounted) {
                return;
            }

            if (!result.ok) {
                setError(result.message);
                setMetrics([]);
                setUsers([]);
                return;
            }

            setError(null);
            setMetrics(result.metrics);
            setUsers(result.users);
        }

        void loadUserManagement();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users.filter((user) => {
            if (roleFilter !== 'ALL' && user.role !== roleFilter) {
                return false;
            }

            if (!query) {
                return true;
            }

            return [user.name, user.email, user.role, user.status].join(' ').toLowerCase().includes(query);
        });
    }, [roleFilter, search, users]);

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">User Management</h1>
                        <p className="text-sm text-stone-500 mt-1">Manage accounts and permissions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search users..."
                                className="placeholder-gray-600 text-gray-900 w-full sm:w-64 pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white shadow-sm"
                            />
                        </div>
                        <div className="relative">
                            <FilterIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                            <select
                                value={roleFilter}
                                onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
                                className="appearance-none pl-9 pr-8 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm"
                            >
                                <option value="ALL">All Roles</option>
                                <option value="Super Admin">Super Admin</option>
                                <option value="Admin">Admin</option>
                                <option value="Manager">Manager</option>
                                <option value="Viewer">Viewer</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            disabled
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add User
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((metric, index) => {
                        const Icon = METRIC_ICONS[index] ?? UsersIcon;
                        const style = METRIC_STYLES[index] ?? METRIC_STYLES[0];

                        return (
                            <div
                                key={metric.name}
                                className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 flex items-center gap-4"
                            >
                                <div className={`p-3 rounded-full ${style.bg} shrink-0`}>
                                    <Icon className={`w-5 h-5 ${style.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-stone-500">{metric.name}</p>
                                    <p className="text-xl font-bold text-stone-900 mt-0.5">{metric.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-stone-200">
                            <thead className="bg-stone-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">User</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Role</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Created</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Last Active</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-stone-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-stone-50/80 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <img
                                                    className="h-8 w-8 rounded-full border border-stone-200 bg-stone-100"
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f5f5f4&color=1c1917&size=32`}
                                                    alt={user.name}
                                                />
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-stone-900">{user.name}</p>
                                                    <p className="text-sm text-stone-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.status === 'Verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">{user.created}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">{user.lastActive}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                type="button"
                                                disabled
                                                className="text-stone-400 hover:text-stone-600 p-1 rounded-md hover:bg-stone-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed"
                                            >
                                                <MoreVerticalIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-stone-500">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
