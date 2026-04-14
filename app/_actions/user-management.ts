"use server";

import { auth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit-log';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export type UserManagementMetric = {
    name: string;
    value: string;
};

export type UserManagementRow = {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Manager' | 'Viewer';
    status: 'Verified' | 'Pending';
    created: string;
    lastActive: string;
};

export type UserManagementEditableRole = UserManagementRow['role'];

type FetchUserManagementResult =
    | {
        ok: true;
        metrics: UserManagementMetric[];
        users: UserManagementRow[];
    }
    | {
        ok: false;
        message: string;
    };

type UpdateUserRoleResult =
    | {
        ok: true;
        role: UserManagementEditableRole;
    }
    | {
        ok: false;
        message: string;
    };

async function logUserManagementAudit(input: {
    action: string;
    status: 'SUCCESS' | 'FAILED';
    message: string;
    userId?: string | null;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}) {
    await createAuditLog({
        action: input.action,
        module: 'User Management',
        status: input.status,
        severity: input.severity ?? (input.status === 'SUCCESS' ? 'LOW' : 'MEDIUM'),
        message: input.message,
        userId: input.userId ?? null,
    });
}

function formatRole(role: 'ADMIN' | 'USER' | 'MANAGER'): UserManagementRow['role'] {
    if (role === 'ADMIN') {
        return 'Admin';
    }

    if (role === 'MANAGER') {
        return 'Manager';
    }

    return 'Viewer';
}

function parseRole(role: UserManagementEditableRole): 'ADMIN' | 'MANAGER' | 'USER' {
    if (role === 'Admin') {
        return 'ADMIN';
    }

    if (role === 'Manager') {
        return 'MANAGER';
    }

    return 'USER';
}

function formatDate(value: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(value);
}

function formatRelativeTime(value: Date | null): string {
    if (!value) {
        return 'Never';
    }

    const diffMs = Date.now() - value.getTime();
    const minuteMs = 60_000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;

    if (diffMs < hourMs) {
        const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
        return `${minutes}m ago`;
    }

    if (diffMs < dayMs) {
        const hours = Math.floor(diffMs / hourMs);
        return `${hours}h ago`;
    }

    const days = Math.floor(diffMs / dayMs);
    return `${days}d ago`;
}

export async function fetchUserManagementAction(): Promise<FetchUserManagementResult> {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                emailVerified: true,
                createdAt: true,
                sessions: {
                    select: {
                        updatedAt: true,
                    },
                    orderBy: {
                        updatedAt: 'desc',
                    },
                    take: 1,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const verifiedCount = users.filter((item) => item.emailVerified).length;
        const pendingCount = users.length - verifiedCount;
        const newThisMonth = users.filter((item) => item.createdAt >= monthStart).length;

        const rows: UserManagementRow[] = users.map((item) => ({
            id: item.id,
            name: item.name,
            email: item.email,
            role: formatRole(item.role),
            status: item.emailVerified ? 'Verified' : 'Pending',
            created: formatDate(item.createdAt),
            lastActive: formatRelativeTime(item.sessions[0]?.updatedAt ?? null),
        }));

        return {
            ok: true,
            metrics: [
                { name: 'Total Users', value: String(users.length) },
                { name: 'Verified', value: String(verifiedCount) },
                { name: 'Pending Verification', value: String(pendingCount) },
                { name: 'New This Month', value: String(newThisMonth) },
            ],
            users: rows,
        };
    } catch (error) {
        console.error('[User Management Action] Failed to fetch users', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
            ok: false,
            message: 'Unable to load user management data right now.',
        };
    }
}

export async function updateUserRoleAction(
    userId: string,
    role: UserManagementEditableRole,
): Promise<UpdateUserRoleResult> {
    let auditUserId: string | null = null;

    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        auditUserId = session?.user?.id ?? null;

        if (!userId) {
            await logUserManagementAudit({
                action: 'Update user role',
                status: 'FAILED',
                message: 'Update failed: User id is required.',
                userId: auditUserId,
            });

            return {
                ok: false,
                message: 'User id is required.',
            };
        }

        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                role: parseRole(role),
            },
        });

        await logUserManagementAudit({
            action: 'Update user role',
            status: 'SUCCESS',
            message: `Updated role for user ${userId} to ${role}.`,
            userId: auditUserId,
        });

        return {
            ok: true,
            role,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await logUserManagementAudit({
            action: 'Update user role',
            status: 'FAILED',
            severity: 'HIGH',
            message: `Role update failed for user ${userId}: ${errorMessage}`,
            userId: auditUserId,
        });

        console.error('[User Management Action] Failed to update user role', {
            userId,
            role,
            error: errorMessage,
        });

        return {
            ok: false,
            message: 'Unable to update role right now.',
        };
    }
}
