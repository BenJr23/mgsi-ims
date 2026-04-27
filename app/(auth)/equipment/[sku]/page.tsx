import { notFound } from 'next/navigation';

import { fetchBranchesAction } from '@/app/_actions/branches';
import { prisma } from '@/lib/prisma';

type EquipmentItemPageProps = {
  params: Promise<{ sku: string }>;
};

function formatDate(value: Date | null | undefined): string {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(value);
}

function formatStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatHistoryEvent(event: string): string {
  return event
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default async function EquipmentItemPage({ params }: EquipmentItemPageProps) {
  const { sku } = await params;

  const [equipmentResult, branchesResult] = await Promise.all([
    prisma.equipment.findFirst({
      where: {
        sku,
        deletedAt: null,
      },
      select: {
        id: true,
        qrCode: true,
        sku: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        areaId: true,
        createdBy: {
          select: {
            name: true,
          },
        },
        equipmentModel: {
          select: {
            name: true,
            type: true,
          },
        },
        locationHistory: {
          orderBy: {
            changedAt: 'desc',
          },
          take: 20,
          select: {
            areaId: true,
            status: true,
            event: true,
            changedAt: true,
            changedBy: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    fetchBranchesAction(),
  ]);

  if (!equipmentResult) {
    notFound();
  }

  const areaLookup = new Map(
    branchesResult.ok
      ? branchesResult.branches.flatMap((branch) =>
          (branch.areas ?? []).map((area) => [area.id, { areaName: area.name, branchName: branch.name }]),
        )
      : [],
  );

  const location = areaLookup.get(equipmentResult.areaId);

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 sm:px-6 lg:px-10">
      <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)]">
        <div className="border-b border-stone-200 bg-[linear-gradient(120deg,#0f172a,#1e293b_40%,#334155)] px-6 py-8 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">Scanned Item</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {equipmentResult.equipmentModel.name}
          </h1>
          <p className="mt-2 text-sm text-slate-200">Authenticated equipment link opened by SKU.</p>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <InfoCard label="SKU" value={equipmentResult.sku ?? 'Not available'} />
          <InfoCard label="Status" value={formatStatus(equipmentResult.status)} />
          <InfoCard label="Model Type" value={equipmentResult.equipmentModel.type} />
          <InfoCard label="Created By" value={equipmentResult.createdBy.name} />
          <InfoCard label="Location" value={location ? `${location.areaName} / ${location.branchName}` : equipmentResult.areaId} />
          <InfoCard label="Created At" value={formatDate(equipmentResult.createdAt)} />
          <InfoCard label="Updated At" value={formatDate(equipmentResult.updatedAt)} />
          <InfoCard
            label="QR Link"
            value={equipmentResult.qrCode}
            link={equipmentResult.qrCode}
            linkText="Open QR link"
          />
        </div>

        <div className="border-t border-stone-200 px-6 py-6 sm:px-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Location and Status History</h2>
          {equipmentResult.locationHistory.length === 0 ? (
            <p className="mt-3 text-sm text-stone-600">No history entries available.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">When</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Event</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Location</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Changed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {equipmentResult.locationHistory.map((entry, index) => {
                    const historyLocation = areaLookup.get(entry.areaId);

                    return (
                      <tr key={`${entry.changedAt.toISOString()}-${index}`}>
                        <td className="px-3 py-2 text-sm text-stone-700 whitespace-nowrap">{new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        }).format(entry.changedAt)}</td>
                        <td className="px-3 py-2 text-sm text-stone-700 whitespace-nowrap">{formatHistoryEvent(entry.event)}</td>
                        <td className="px-3 py-2 text-sm text-stone-700 whitespace-nowrap">{formatStatus(entry.status)}</td>
                        <td className="px-3 py-2 text-sm text-stone-700">{historyLocation ? `${historyLocation.areaName} / ${historyLocation.branchName}` : entry.areaId}</td>
                        <td className="px-3 py-2 text-sm text-stone-700 whitespace-nowrap">{entry.changedBy?.name ?? 'System'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

type InfoCardProps = {
  label: string;
  value: string;
  link?: string;
  linkText?: string;
};

function InfoCard({ label, value, link, linkText }: InfoCardProps) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 wrap-break-word text-sm font-semibold text-stone-900">{value}</p>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-medium text-blue-700 hover:underline"
        >
          {linkText ?? 'Open link'}
        </a>
      ) : null}
    </article>
  );
}
