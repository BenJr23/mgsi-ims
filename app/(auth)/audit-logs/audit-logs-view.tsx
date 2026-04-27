"use client";

import React, { useMemo, useState } from 'react';
import {
    SearchIcon,
    ShieldCheckIcon,
    AlertTriangleIcon,
    Clock3Icon,
    UserXIcon,
    DownloadIcon,
} from 'lucide-react';

import type { AuditLogRow, AuditSeverity } from '@/app/_actions/audit-logs';

type AuditLogsViewProps = {
    initialLogs: AuditLogRow[];
};

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function getSeverityBadge(severity: AuditSeverity) {
    switch (severity) {
        case 'LOW':
            return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'MEDIUM':
            return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'HIGH':
            return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'CRITICAL':
            return 'bg-rose-100 text-rose-800 border-rose-200';
    }
}

function getStatusBadge(status: AuditLogRow['status']) {
    return status === 'SUCCESS'
        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
        : 'bg-rose-100 text-rose-800 border-rose-200';
}

export function AuditLogsView({ initialLogs }: AuditLogsViewProps) {
    const [query, setQuery] = useState('');
    const [severityFilter, setSeverityFilter] = useState<'ALL' | AuditSeverity>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | AuditLogRow['status']>('ALL');
    const [page, setPage] = useState(1);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    const perPage = 10;

    const filteredLogs = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return initialLogs.filter((row) => {
            if (severityFilter !== 'ALL' && row.severity !== severityFilter) {
                return false;
            }

            if (statusFilter !== 'ALL' && row.status !== statusFilter) {
                return false;
            }

            if (!normalizedQuery) {
                return true;
            }

            return [row.id, row.user, row.action, row.module]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery);
        });
    }, [initialLogs, query, severityFilter, statusFilter]);

    const pageCount = Math.max(1, Math.ceil(filteredLogs.length / perPage));

    const paginatedLogs = useMemo(() => {
        const start = (page - 1) * perPage;
        return filteredLogs.slice(start, start + perPage);
    }, [filteredLogs, page]);

    const totalLogs = initialLogs.length;
    const criticalCount = initialLogs.filter((row) => row.severity === 'CRITICAL').length;
    const failedCount = initialLogs.filter((row) => row.status === 'FAILED').length;
    const todayDate = new Date().toISOString().slice(0, 10);
    const todayCount = initialLogs.filter((row) => row.timestamp.startsWith(todayDate)).length;

    React.useEffect(() => {
        setPage(1);
    }, [query, severityFilter, statusFilter]);

    const handleExportCsv = () => {
        if (filteredLogs.length === 0) {
            return;
        }

        const header = ['Timestamp', 'User', 'Action', 'Module', 'Severity', 'Status'];
        const rows = filteredLogs.map((row) => [
            formatDateTime(row.timestamp),
            row.user,
            row.action,
            row.module,
            row.severity,
            row.status,
        ]);

        const csvContent = [header, ...rows]
            .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `audit-logs-${todayDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportPdf = async () => {
        if (filteredLogs.length === 0 || isExportingPdf) {
            return;
        }

        setIsExportingPdf(true);

        try {
            const [{ jsPDF }, { default: autoTable }] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable'),
            ]);

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'pt',
                format: 'a4',
            });

            doc.setFontSize(14);
            doc.text('Audit Logs', 40, 40);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

            autoTable(doc, {
                startY: 72,
                head: [['Timestamp', 'User', 'Action', 'Module', 'Severity', 'Status']],
                body: filteredLogs.map((row) => [
                    formatDateTime(row.timestamp),
                    row.user,
                    row.action,
                    row.module,
                    row.severity,
                    row.status,
                ]),
                styles: {
                    fontSize: 8,
                    cellPadding: 5,
                },
                headStyles: {
                    fillColor: [28, 25, 23],
                    textColor: [255, 255, 255],
                },
            });

            doc.save(`audit-logs-${todayDate}.pdf`);
        } catch (error) {
            console.error('[Audit Logs] PDF export failed', error);
        } finally {
            setIsExportingPdf(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Audit Logs</h1>
                        <p className="text-sm text-stone-500 mt-1">
                            Review account activity, security events, and sensitive actions.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            disabled={filteredLogs.length === 0}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <DownloadIcon className="w-4 h-4" aria-hidden="true" />
                            Export CSV
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleExportPdf()}
                            disabled={filteredLogs.length === 0 || isExportingPdf}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <DownloadIcon className="w-4 h-4" aria-hidden="true" />
                            {isExportingPdf ? 'Exporting PDF...' : 'Export PDF'}
                        </button>
                    </div>
                </div>

                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Audit log metrics">
                    <article className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-stone-100 text-stone-600">
                                <ShieldCheckIcon className="w-5 h-5" aria-hidden="true" />
                            </div>
                            <p className="text-sm font-medium text-stone-600">Total Logs</p>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-stone-900">{totalLogs}</p>
                    </article>

                    <article className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-rose-100 text-rose-700">
                                <AlertTriangleIcon className="w-5 h-5" aria-hidden="true" />
                            </div>
                            <p className="text-sm font-medium text-stone-600">Critical Events</p>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-stone-900">{criticalCount}</p>
                    </article>

                    <article className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-amber-100 text-amber-700">
                                <Clock3Icon className="w-5 h-5" aria-hidden="true" />
                            </div>
                            <p className="text-sm font-medium text-stone-600">Today</p>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-stone-900">{todayCount}</p>
                    </article>

                    <article className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-rose-100 text-rose-700">
                                <UserXIcon className="w-5 h-5" aria-hidden="true" />
                            </div>
                            <p className="text-sm font-medium text-stone-600">Failed Events</p>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-stone-900">{failedCount}</p>
                    </article>
                </section>

                <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" aria-hidden="true" />
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search by ID, user, action, or module..."
                            className="placeholder-gray-600 text-gray-900 w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            aria-label="Search audit logs"
                        />
                    </div>

                    <select
                        value={severityFilter}
                        onChange={(event) => setSeverityFilter(event.target.value as 'ALL' | AuditSeverity)}
                        className="h-10 px-3 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        aria-label="Filter by severity"
                    >
                        <option value="ALL">All severities</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value as 'ALL' | AuditLogRow['status'])}
                        className="h-10 px-3 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        aria-label="Filter by status"
                    >
                        <option value="ALL">All status</option>
                        <option value="SUCCESS">Success</option>
                        <option value="FAILED">Failed</option>
                    </select>
                </section>

                <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden" aria-label="Audit logs table">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-stone-200">
                            <thead className="bg-stone-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Timestamp</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Module</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Severity</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {paginatedLogs.length > 0 ? (
                                    paginatedLogs.map((row) => (
                                        <tr key={row.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-stone-600 whitespace-nowrap">{formatDateTime(row.timestamp)}</td>
                                            <td className="px-4 py-3 text-sm text-stone-800 whitespace-nowrap">{row.user}</td>
                                            <td className="px-4 py-3 text-sm text-stone-800 min-w-56">{row.action}</td>
                                            <td className="px-4 py-3 text-sm text-stone-600 whitespace-nowrap">{row.module}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getSeverityBadge(row.severity)}`}>
                                                    {row.severity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(row.status)}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="px-4 py-8 text-sm text-stone-500 text-center" colSpan={6}>
                                            No audit logs found for the current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-stone-200 bg-stone-50">
                        <p className="text-sm text-stone-600">
                            Showing {paginatedLogs.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, filteredLogs.length)} of {filteredLogs.length} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-sm rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-stone-600">Page {page} of {pageCount}</span>
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                                disabled={page === pageCount}
                                className="px-3 py-1.5 text-sm rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
