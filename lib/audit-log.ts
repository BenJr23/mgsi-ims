import { prisma } from '@/lib/prisma';

type CreateAuditLogInput = {
    action: string;
    module: string;
    status?: 'SUCCESS' | 'FAILED';
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message?: string;
    userId?: string | null;
    userAgent?: string | null;
};

export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                action: input.action,
                module: input.module,
                status: input.status ?? 'SUCCESS',
                severity: input.severity ?? 'LOW',
                message: input.message ?? null,
                userId: input.userId ?? null,
                userAgent: input.userAgent ?? null,
            },
        });
    } catch (error) {
        console.error('[Audit Log] Failed to create audit log', {
            error: error instanceof Error ? error.message : 'Unknown error',
            action: input.action,
            module: input.module,
        });
    }
}
