"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { AuditSessionStatus, AuditItemStatus } from "@/app/generated/prisma/enums";
import { fetchBranchesAction } from "@/app/_actions/branches";

export type AuditSessionWithItems = {
  id: string;
  status: AuditSessionStatus;
  areaId: string;
  areaName: string;
  startedAt: string;
  completedAt: string | null;
  startedBy: {
    id: string;
    name: string;
  };
  itemCount: number;
  createdAt: string;
};

export type AuditSessionItemDetail = {
  id: string;
  equipmentId: string;
  status: AuditItemStatus;
  notes: string | null;
  scannedAt: string;
  equipment: {
    id: string;
    qrCode: string;
    sku: string | null;
    equipmentModel: {
      name: string;
      type: string;
    };
  };
};

export type AuditSessionDetail = {
  id: string;
  status: AuditSessionStatus;
  areaId: string;
  areaName: string;
  branchId: string;
  startedAt: string;
  completedAt: string | null;
  startedBy: {
    id: string;
    name: string;
  };
  items: AuditSessionItemDetail[];
  createdAt: string;
};

type CreateAuditSessionResult =
  | { ok: true; sessionId: string }
  | { ok: false; message: string };

type GetAuditSessionsResult =
  | { ok: true; sessions: AuditSessionWithItems[] }
  | { ok: false; message: string };

type GetAuditSessionDetailResult =
  | { ok: true; session: AuditSessionDetail }
  | { ok: false; message: string };

type GetAuditSessionItemDetailResult =
  | { ok: true; item: AuditSessionItemDetail }
  | { ok: false; message: string };

type AddAuditItemResult =
  | { ok: true; itemId: string }
  | { ok: false; message: string };

type CompleteAuditSessionResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Create a new audit session
 */
export async function createAuditSessionAction(areaId: string): Promise<CreateAuditSessionResult> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { ok: false, message: "Unauthorized" };
    }

    const normalizedAreaId = areaId.trim();
    if (!normalizedAreaId) {
      return { ok: false, message: "Area is required" };
    }

    const equipmentCount = await prisma.equipment.count({
      where: {
        areaId: normalizedAreaId,
        deletedAt: null,
      },
    });

    if (equipmentCount <= 0) {
      return { ok: false, message: "This area has no equipment yet, so an audit session cannot be started." };
    }

    const auditSession = await prisma.auditSession.create({
      data: {
        startedById: session.user.id,
        areaId: normalizedAreaId,
        status: "IN_PROGRESS",
      },
    });

    return { ok: true, sessionId: auditSession.id };
  } catch (error) {
    console.error("Error creating audit session:", error);
    return { ok: false, message: "Failed to create audit session" };
  }
}

/**
 * Get all audit sessions
 */
export async function getAuditSessionsAction(): Promise<GetAuditSessionsResult> {
  try {
    const branchesResult = await fetchBranchesAction();
    const areaInfoById = new Map<string, { areaName: string }>();

    if (branchesResult.ok) {
      for (const branch of branchesResult.branches) {
        for (const area of branch.areas ?? []) {
          areaInfoById.set(area.id, { areaName: area.name });
        }
      }
    }

    const sessions = await prisma.auditSession.findMany({
      select: {
        id: true,
        status: true,
        areaId: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        startedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return {
      ok: true,
      sessions: sessions.map((s) => ({
        id: s.id,
        status: s.status,
        areaId: s.areaId,
        areaName: areaInfoById.get(s.areaId)?.areaName ?? s.areaId,
        startedAt: s.startedAt.toISOString(),
        completedAt: s.completedAt?.toISOString() || null,
        startedBy: s.startedBy,
        itemCount: s._count.items,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching audit sessions:", error);
    return { ok: false, message: "Failed to fetch audit sessions" };
  }
}

/**
 * Get audit session details with items
 */
export async function getAuditSessionDetailAction(
  sessionId: string
): Promise<GetAuditSessionDetailResult> {
  try {
    const branchesResult = await fetchBranchesAction();
    const areaInfoById = new Map<string, { areaName: string; branchId: string }>();

    if (branchesResult.ok) {
      for (const branch of branchesResult.branches) {
        for (const area of branch.areas ?? []) {
          areaInfoById.set(area.id, { areaName: area.name, branchId: branch.id });
        }
      }
    }

    const session = await prisma.auditSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        areaId: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        startedBy: {
          select: { id: true, name: true },
        },
        items: {
          select: {
            id: true,
            equipmentId: true,
            status: true,
            notes: true,
            scannedAt: true,
            equipment: {
              select: {
                id: true,
                qrCode: true,
                sku: true,
                equipmentModel: {
                  select: {
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
          orderBy: { scannedAt: "desc" },
        },
      },
    });

    if (!session) {
      return { ok: false, message: "Session not found" };
    }

    const areaInfo = areaInfoById.get(session.areaId);

    return {
      ok: true,
      session: {
        id: session.id,
        status: session.status,
        areaId: session.areaId,
        areaName: areaInfo?.areaName ?? session.areaId,
        branchId: areaInfo?.branchId ?? "",
        startedAt: session.startedAt.toISOString(),
        completedAt: session.completedAt?.toISOString() || null,
        startedBy: session.startedBy,
        items: session.items.map((item) => ({
          id: item.id,
          equipmentId: item.equipmentId,
          status: item.status,
          notes: item.notes,
          scannedAt: item.scannedAt.toISOString(),
          equipment: {
            id: item.equipment.id,
            qrCode: item.equipment.qrCode,
            sku: item.equipment.sku || "",
            equipmentModel: {
              name: item.equipment.equipmentModel.name,
              type: item.equipment.equipmentModel.type,
            },
          },
        })),
        createdAt: session.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error fetching audit session details:", error);
    return { ok: false, message: "Failed to fetch audit session details" };
  }
}

/**
 * Add item to audit session
 */
export async function addAuditItemAction(
  sessionId: string,
  equipmentId: string,
  status: AuditItemStatus = "AVAILABLE",
  notes?: string
): Promise<AddAuditItemResult> {
  try {
    const session = await prisma.auditSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true, areaId: true },
    });

    if (!session) {
      return { ok: false, message: "Session not found" };
    }

    if (session.status !== "IN_PROGRESS") {
      return { ok: false, message: "Session is not in progress" };
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      select: { id: true, areaId: true },
    });

    if (!equipment) {
      return { ok: false, message: "Equipment not found" };
    }

    if (equipment.areaId !== session.areaId) {
      return { ok: false, message: "Scanned equipment is outside the session area" };
    }

    const auditItem = await prisma.auditSessionItem.upsert({
      where: {
        sessionId_equipmentId: { sessionId, equipmentId },
      },
      create: {
        sessionId,
        equipmentId,
        status,
        notes: notes || null,
      },
      update: {
        status,
        notes: notes || null,
        scannedAt: new Date(),
      },
    });

    return { ok: true, itemId: auditItem.id };
  } catch (error) {
    console.error("Error adding audit item:", error);
    return { ok: false, message: "Failed to add item to audit session" };
  }
}

/**
 * Get audit session item detail
 */
export async function getAuditSessionItemDetailAction(
  itemId: string
): Promise<GetAuditSessionItemDetailResult> {
  try {
    const item = await prisma.auditSessionItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        equipmentId: true,
        status: true,
        notes: true,
        scannedAt: true,
        equipment: {
          select: {
            id: true,
            qrCode: true,
            sku: true,
            equipmentModel: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return { ok: false, message: "Item not found" };
    }

    return {
      ok: true,
      item: {
        id: item.id,
        equipmentId: item.equipmentId,
        status: item.status,
        notes: item.notes,
        scannedAt: item.scannedAt.toISOString(),
        equipment: {
          id: item.equipment.id,
          qrCode: item.equipment.qrCode,
          sku: item.equipment.sku || "",
          equipmentModel: {
            name: item.equipment.equipmentModel.name,
            type: item.equipment.equipmentModel.type,
          },
        },
      },
    };
  } catch (error) {
    console.error("Error fetching audit item detail:", error);
    return { ok: false, message: "Failed to fetch audit item detail" };
  }
}

/**
 * Complete an audit session
 */
export async function completeAuditSessionAction(
  sessionId: string
): Promise<CompleteAuditSessionResult> {
  try {
    const session = await prisma.auditSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true },
    });

    if (!session) {
      return { ok: false, message: "Session not found" };
    }

    if (session.status !== "IN_PROGRESS") {
      return { ok: false, message: "Session is not in progress" };
    }

    await prisma.auditSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("Error completing audit session:", error);
    return { ok: false, message: "Failed to complete audit session" };
  }
}

/**
 * Cancel an audit session
 */
export async function cancelAuditSessionAction(
  sessionId: string
): Promise<CompleteAuditSessionResult> {
  try {
    const session = await prisma.auditSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true },
    });

    if (!session) {
      return { ok: false, message: "Session not found" };
    }

    if (session.status !== "IN_PROGRESS") {
      return { ok: false, message: "Session is not in progress" };
    }

    await prisma.auditSession.update({
      where: { id: sessionId },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("Error cancelling audit session:", error);
    return { ok: false, message: "Failed to cancel audit session" };
  }
}