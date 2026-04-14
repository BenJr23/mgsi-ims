"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { RegisterEquipmentModal } from '../components/modals/RegisterEquipmentModal';
import {
  createEquipmentAction,
  fetchEquipmentAction,
  type EquipmentListItem,
} from '@/app/_actions/equipment';
import { fetchBranchesAction, type BranchItem } from '@/app/_actions/branches';
import {
  fetchEquipmentModelsAction,
  type EquipmentModelListItem,
} from '@/app/_actions/equipmentmodel';
import {
  QrCodeIcon,
  SearchIcon,
  PlusIcon,
  FilterIcon,
  DownloadIcon,
  PrinterIcon,
  MoreVerticalIcon,
  CheckCircle2Icon,
  WrenchIcon,
  ArchiveIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

type EquipmentStatus = 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED' | 'LOST';

const STATUS_TABS: { label: string; value: EquipmentStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
  { label: 'Retired', value: 'RETIRED' },
  { label: 'Lost', value: 'LOST' },
];

function getStatusBadge(status: EquipmentStatus) {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'MAINTENANCE':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'RETIRED':
      return 'bg-stone-100 text-stone-600 border-stone-200';
    case 'LOST':
      return 'bg-rose-100 text-rose-800 border-rose-200';
  }
}

function getStatusIcon(status: EquipmentStatus) {
  switch (status) {
    case 'AVAILABLE':
      return CheckCircle2Icon;
    case 'MAINTENANCE':
      return WrenchIcon;
    case 'RETIRED':
      return ArchiveIcon;
    case 'LOST':
      return AlertTriangleIcon;
  }
}

function formatStatus(status: EquipmentStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatEquipmentQrLink(qrCode: string): string {
  try {
    const parsedUrl = new URL(qrCode);
    return `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return qrCode.startsWith('http://') || qrCode.startsWith('https://')
      ? qrCode
      : `https://${qrCode}`;
  }
}

function getEquipmentQrDisplay(sku: string | null, qrCode: string): string {
  if (sku?.trim()) {
    return sku;
  }

  try {
    const parsedUrl = new URL(formatEquipmentQrLink(qrCode));
    const lastSegment = parsedUrl.pathname.split('/').filter(Boolean).pop();
    return lastSegment ? decodeURIComponent(lastSegment) : qrCode;
  } catch {
    return qrCode;
  }
}

export default function EquipmentPage() {
  const [activeTab, setActiveTab] = useState<EquipmentStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterEquipmentModalOpen, setIsRegisterEquipmentModalOpen] = useState(false);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [models, setModels] = useState<EquipmentModelListItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentListItem[]>([]);
  const [isLoadingSupportData, setIsLoadingSupportData] = useState(true);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(true);
  const [isSubmittingEquipment, setIsSubmittingEquipment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printQuantities, setPrintQuantities] = useState<Record<string, string>>({});

  const loadSupportData = async () => {
    setIsLoadingSupportData(true);

    try {
      const [branchesResult, modelsResult] = await Promise.all([
        fetchBranchesAction(),
        fetchEquipmentModelsAction(),
      ]);

      if (!branchesResult.ok) {
        setError(branchesResult.message);
        setBranches([]);
        setModels([]);
        return;
      }

      if (!modelsResult.ok) {
        setError(modelsResult.message);
        setBranches([]);
        setModels([]);
        return;
      }

      setBranches(branchesResult.branches);
      setModels(modelsResult.models);
    } catch {
      setError('Unable to load equipment form data right now.');
      setBranches([]);
      setModels([]);
    } finally {
      setIsLoadingSupportData(false);
    }
  };

  const loadEquipment = async () => {
    setIsLoadingEquipment(true);

    try {
      const result = await fetchEquipmentAction();

      if (!result.ok) {
        setError(result.message);
        setEquipment([]);
        return;
      }

      setEquipment(result.equipment);
    } catch {
      setError('Unable to load equipment right now.');
      setEquipment([]);
    } finally {
      setIsLoadingEquipment(false);
    }
  };

  useEffect(() => {
    void loadSupportData();
    void loadEquipment();
  }, []);

  const modelOptions = useMemo(
    () =>
      models.map((model) => ({
        id: model.id,
        name: model.name,
      })),
    [models],
  );

  const areaOptions = useMemo(
    () =>
      branches.flatMap((branch) =>
        (branch.areas ?? []).map((area) => ({
          id: area.id,
          name: `${area.name} — ${branch.name}`,
        })),
      ),
    [branches],
  );

  const metrics = useMemo(() => {
    const availableCount = equipment.filter((item) => item.status === 'AVAILABLE').length;
    const maintenanceCount = equipment.filter((item) => item.status === 'MAINTENANCE').length;
    const retiredOrLostCount = equipment.filter(
      (item) => item.status === 'RETIRED' || item.status === 'LOST',
    ).length;

    return [
      {
        name: 'Total Equipment',
        value: String(equipment.length),
        icon: QrCodeIcon,
        color: 'text-stone-600',
        bg: 'bg-stone-100',
      },
      {
        name: 'Available',
        value: String(availableCount),
        icon: CheckCircle2Icon,
        color: 'text-emerald-600',
        bg: 'bg-emerald-100',
      },
      {
        name: 'In Maintenance',
        value: String(maintenanceCount),
        icon: WrenchIcon,
        color: 'text-amber-600',
        bg: 'bg-amber-100',
      },
      {
        name: 'Lost / Retired',
        value: String(retiredOrLostCount),
        icon: AlertTriangleIcon,
        color: 'text-rose-600',
        bg: 'bg-rose-100',
      },
    ];
  }, [equipment]);

  const filteredEquipment = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return equipment.filter((item) => {
      if (activeTab !== 'ALL' && item.status !== activeTab) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        item.qrCode,
        item.sku ?? '',
        item.modelName,
        item.modelType,
        item.areaName,
        item.branchName,
        item.createdBy,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [activeTab, equipment, searchQuery]);

  const handleRegisterEquipmentSubmit = async (data: {
    equipmentModelId: string;
    status: EquipmentStatus;
    areaId: string;
  }) => {
    setIsSubmittingEquipment(true);
    setError(null);

    try {
      const result = await createEquipmentAction(data);

      if (!result.ok) {
        setError(result.message);
        return false;
      }

      await loadEquipment();
      setIsRegisterEquipmentModalOpen(false);
      return true;
    } catch {
      setError('Unable to register equipment right now. Please try again.');
      return false;
    } finally {
      setIsSubmittingEquipment(false);
    }
  };

  const handlePrintEquipmentQr = async (item: EquipmentListItem) => {
    const quantityInput = (printQuantities[item.id] ?? '1').trim();
    const quantity = Number.parseInt(quantityInput, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Please enter a valid print quantity greater than 0.');
      return;
    }

    if (quantity > 200) {
      setError('Please enter a print quantity up to 200 labels.');
      return;
    }

    setError(null);

    let qrDataUrl = '';
    try {
      const QRCodeLib = await import('qrcode');
      qrDataUrl = await QRCodeLib.toDataURL(item.qrCode, {
        width: 340,
        margin: 1,
        errorCorrectionLevel: 'H',
      });
    } catch {
      setError('Unable to generate QR code image for printing right now.');
      return;
    }

    const printWindow = window.open('', '', 'width=1100,height=800');
    if (!printWindow) {
      setError('Please allow pop-ups to print QR codes.');
      return;
    }

    const logoUrl = new URL('/logo/GWlogo.webp', window.location.origin).toString();
    let labelsHtml = '';

    for (let i = 0; i < quantity; i++) {
      labelsHtml += `
        <div class="label">
          <div class="meta"><strong>${item.modelName}</strong></div>
          <div class="qr-code">
            <img class="qr-image" src="${qrDataUrl}" alt="QR code" />
          </div>
          <img class="logo" src="${logoUrl}" alt="Great Work logo" />
          <div class="qr-value">${item.qrCode}</div>
        </div>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Print QR - ${item.qrCode}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: Arial, sans-serif;
            background: #f1f5f9;
            padding: 20px;
          }
          .print-ui {
            text-align: center;
            margin-bottom: 12px;
          }
          .print-btn {
            background: #2563eb;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            cursor: pointer;
            font-weight: 700;
          }
          .print-note {
            margin-top: 8px;
            font-size: 12px;
            color: #475569;
          }
          .sheet {
            width: 8.5in;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(3, 2.6in);
            column-gap: 0.12in;
            row-gap: 0.12in;
            justify-content: center;
          }
          .label {
            width: 2.5in;
            min-height: 2.75in;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px;
          }
          .meta {
            width: 100%;
            text-align: center;
            color: #0f172a;
          }
          .qr-code {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .qr-image {
            width: 220px;
            height: 220px;
          }
          .logo {
            width: 0.88in;
            height: 0.18in;
            object-fit: contain;
          }
          .qr-value {
            font-family: monospace;
            font-size: 12px;
            color: #334155;
            word-break: break-all;
          }
          @media print {
            @page { size: auto; margin: 0.2in; }
            body { background: #ffffff; padding: 0; }
            .print-ui { display: none; }
            .label { border: 1px solid #000; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-ui">
          <button class="print-btn" onclick="window.print()">Print ${quantity} QR Label(s)</button>
          <div class="print-note">If you see empty images, wait 1-2 seconds then click Print again.</div>
        </div>
        <div class="sheet">
          ${labelsHtml}
        </div>
        <script>
          const images = Array.from(document.querySelectorAll('img'));
          Promise.all(
            images.map((image) => new Promise((resolve) => {
              if (image.complete) {
                resolve();
                return;
              }
              image.onload = () => resolve();
              image.onerror = () => resolve();
            }))
          ).then(() => {
            document.title = 'Print QR - ready';
          });
        <\/script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Equipment
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Track and manage individual equipment items
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
              <DownloadIcon className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setIsRegisterEquipmentModalOpen(true)}
              disabled={isLoadingSupportData || isLoadingEquipment || isSubmittingEquipment}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm"
            >
              <PlusIcon className="w-4 h-4" aria-hidden="true" />
              Register Equipment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 flex items-center gap-4"
              >
                <div className={`p-3 rounded-full ${metric.bg} shrink-0`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-500">{metric.name}</p>
                  <p className="text-xl font-bold text-stone-900 mt-0.5">{metric.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex overflow-x-auto gap-1 hide-scrollbar">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.value ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 lg:w-64">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by QR, SKU, model..."
                  className="placeholder-gray-600 w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50"
                />
              </div>
              <button className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors">
                <FilterIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    QR Link
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-100">
                {filteredEquipment.map((item) => {
                  const StatusIcon = getStatusIcon(item.status);
                  const qrLink = formatEquipmentQrLink(item.qrCode);
                  const qrDisplay = getEquipmentQrDisplay(item.sku, item.qrCode);

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={qrLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
                          title={qrLink}
                        >
                          <QrCodeIcon className="w-4 h-4 text-blue-600" />
                          {qrDisplay}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-stone-900">{item.modelName}</p>
                          <p className="text-xs text-stone-500">{item.modelType}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-stone-500 font-mono">
                          {item.sku || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {formatStatus(item.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-stone-900">{item.areaName}</p>
                          <p className="text-xs text-stone-500">{item.branchName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-stone-500">{item.createdAt}</p>
                          <p className="text-xs text-stone-400">{item.createdBy}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min={1}
                            max={200}
                            value={printQuantities[item.id] ?? '1'}
                            onChange={(event) =>
                              setPrintQuantities((prev) => ({
                                ...prev,
                                [item.id]: event.target.value,
                              }))
                            }
                            className="w-16 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700 focus:border-amber-500 focus:outline-none"
                            aria-label={`Print quantity for ${item.qrCode}`}
                            title="Print quantity"
                          />
                          <button
                            onClick={() => {
                              void handlePrintEquipmentQr(item);
                            }}
                            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-md hover:bg-stone-100 transition-colors"
                            title="Print QR"
                            aria-label={`Print QR for ${item.qrCode}`}
                          >
                            <PrinterIcon className="w-4 h-4" />
                          </button>
                          <button className="text-stone-400 hover:text-stone-600 p-1 rounded-md hover:bg-stone-100 transition-colors">
                            <MoreVerticalIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!isLoadingEquipment && filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-stone-500">
                      No equipment records found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <RegisterEquipmentModal
        isOpen={isRegisterEquipmentModalOpen}
        onClose={() => setIsRegisterEquipmentModalOpen(false)}
        onSubmit={handleRegisterEquipmentSubmit}
        isSubmitting={isSubmittingEquipment}
        models={modelOptions}
        areas={areaOptions}
      />
    </div>
  );
}