import { NextResponse } from "next/server";

import { fetchBranchesAction } from "@/app/_actions/branches";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSku = searchParams.get("sku") ?? "";
  const sku = rawSku.trim();
  const traceId = `equipment_lookup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  console.log("[Equipment API] Lookup start", { traceId, rawSku, sku });

  if (!sku) {
    console.warn("[Equipment API] Empty SKU", { traceId });
    return NextResponse.json(
      { ok: false, message: "SKU is required." },
      { status: 400 }
    );
  }

  try {
    const equipment = await prisma.equipment.findFirst({
      where: {
        sku: {
          equals: sku,
          mode: "insensitive",
        },
        deletedAt: null,
      },
      select: {
        id: true,
        qrCode: true,
        sku: true,
        status: true,
        areaId: true,
        equipmentModel: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    if (!equipment || !equipment.sku) {
      console.warn("[Equipment API] No match", { traceId, sku });
      return NextResponse.json(
        { ok: false, message: "No equipment found for this SKU." },
        { status: 404 }
      );
    }

    const branchesResult = await fetchBranchesAction();
    if (!branchesResult.ok) {
      return NextResponse.json(
        { ok: false, message: branchesResult.message },
        { status: 500 }
      );
    }

    const matchedBranch = branchesResult.branches.find((branch) =>
      (branch.areas ?? []).some((area) => area.id === equipment.areaId)
    );

    const matchedArea = matchedBranch?.areas?.find((area) => area.id === equipment.areaId) ?? null;

    return NextResponse.json({
      ok: true,
      equipment: {
        id: equipment.id,
        qrCode: equipment.qrCode,
        sku: equipment.sku,
        status: equipment.status,
        modelName: equipment.equipmentModel.name,
        modelType: equipment.equipmentModel.type,
        areaId: equipment.areaId,
        branchId: matchedBranch?.id ?? "",
        areaName: matchedArea?.name ?? equipment.areaId,
        branchName: matchedBranch?.name ?? "Unknown branch",
      },
    });
  } catch (error) {
    console.error("[Equipment API] Lookup failed", {
      traceId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { ok: false, message: "Unable to look up equipment right now." },
      { status: 500 }
    );
  }
}
