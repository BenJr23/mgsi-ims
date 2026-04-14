"use server";

import { prisma } from '@/lib/prisma';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AuditStatus = 'SUCCESS' | 'FAILED';

export type AuditLogRow = {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    module: string;
    ip: string;
    severity: AuditSeverity;
    status: AuditStatus;
};

type FetchAuditLogsResult =
    | {
        ok: true;
        logs: AuditLogRow[];
    }
    | {
        ok: false;
        message: string;
    };

export async function fetchAuditLogsAction(limit = 250): Promise<FetchAuditLogsResult> {
    try {
        const logs = await prisma.auditLog.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: Math.max(1, Math.min(limit, 500)),
        });

        return {
            ok: true,
            logs: logs.map((row) => ({
                id: row.id,
                timestamp: row.createdAt.toISOString(),
                user: row.user?.name ?? 'Unknown',
                action: row.action,
                module: row.module,
                ip: row.ipAddress ?? 'Unknown',
                severity: row.severity,
                status: row.status,
            })),
        };
    } catch (error) {
        console.error('[Audit Logs Action] Failed to fetch logs', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
            ok: false,
            message: 'Unable to load audit logs right now.',
        };
    }
}
