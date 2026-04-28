"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RegisterEquipmentModal } from '../components/modals/RegisterEquipmentModal';
import { ViewEquipmentList } from '../components/modals/ViewEquipmentList';
import { EditEquipmentModal } from '../components/modals/EditEquipmentModal';
import { DeleteEquipmentModal } from '../components/modals/DeleteEquipmentModal';
import {
  createEquipmentAction,
  updateEquipmentAction,
  deleteEquipmentAction,
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
  FilterIcon,
  PlusIcon,
  DownloadIcon,
  PrinterIcon,
  MoreVerticalIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
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
  const preferredProtocol = process.env.NODE_ENV === 'development' ? 'http:' : 'https:';

  try {
    const parsedUrl = new URL(qrCode);
    return `${preferredProtocol}//${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    const normalized = qrCode.replace(/^https?:\/\//i, '');
    return `${preferredProtocol}//${normalized}`;
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
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('ALL');
  const [selectedModelFilters, setSelectedModelFilters] = useState<string[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isRegisterEquipmentModalOpen, setIsRegisterEquipmentModalOpen] = useState(false);
  const [isViewEquipmentModalOpen, setIsViewEquipmentModalOpen] = useState(false);
  const [isEditEquipmentModalOpen, setIsEditEquipmentModalOpen] = useState(false);
  const [isDeleteEquipmentModalOpen, setIsDeleteEquipmentModalOpen] = useState(false);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [models, setModels] = useState<EquipmentModelListItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentListItem[]>([]);
  const [isLoadingSupportData, setIsLoadingSupportData] = useState(true);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(true);
  const [isSubmittingEquipment, setIsSubmittingEquipment] = useState(false);
  const [isUpdatingEquipment, setIsUpdatingEquipment] = useState(false);
  const [isDeletingEquipment, setIsDeletingEquipment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentListItem | null>(null);
  const [openMenu, setOpenMenu] = useState<{
    equipmentId: string;
    top: number;
    left: number;
  } | null>(null);
  const [printQuantities, setPrintQuantities] = useState<Record<string, string>>({});
  const filterPanelRef = useRef<HTMLDivElement>(null);

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

  const branchFilterOptions = useMemo(
    () => ['ALL', ...Array.from(new Set(branches.map((branch) => branch.name)))],
    [branches],
  );

  const areaFilterOptions = useMemo(
    () => {
      if (selectedBranchFilter === 'ALL') {
        return [
          'ALL',
          ...Array.from(
            new Set(
              branches.flatMap((branch) =>
                (branch.areas ?? []).map((area) => area.name),
              ),
            ),
          ),
        ];
      }

      const selectedBranch = branches.find((branch) => branch.name === selectedBranchFilter);
      return ['ALL', ...Array.from(new Set((selectedBranch?.areas ?? []).map((area) => area.name)))];
    },
    [branches, selectedBranchFilter],
  );

  const modelFilterOptions = useMemo(
    () => Array.from(new Set(models.map((model) => model.name))),
    [models],
  );

  useEffect(() => {
    if (selectedAreaFilter !== 'ALL' && !areaFilterOptions.includes(selectedAreaFilter)) {
      setSelectedAreaFilter('ALL');
    }
  }, [areaFilterOptions, selectedAreaFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!filterPanelRef.current?.contains(event.target as Node)) {
        setIsFilterPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeTab !== 'ALL') count += 1;
    if (selectedBranchFilter !== 'ALL') count += 1;
    if (selectedAreaFilter !== 'ALL') count += 1;
    if (selectedModelFilters.length > 0) count += 1;
    if (searchQuery.trim()) count += 1;
    return count;
  }, [activeTab, searchQuery, selectedAreaFilter, selectedBranchFilter, selectedModelFilters]);

  const filteredEquipment = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return equipment.filter((item) => {
      if (activeTab !== 'ALL' && item.status !== activeTab) {
        return false;
      }

      if (selectedBranchFilter !== 'ALL' && item.branchName !== selectedBranchFilter) {
        return false;
      }

      if (selectedAreaFilter !== 'ALL' && item.areaName !== selectedAreaFilter) {
        return false;
      }

      if (selectedModelFilters.length > 0 && !selectedModelFilters.includes(item.modelName)) {
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
  }, [
    activeTab,
    equipment,
    searchQuery,
    selectedAreaFilter,
    selectedBranchFilter,
    selectedModelFilters,
  ]);

  const handleRegisterEquipmentSubmit = async (data: {
    equipmentModelId: string;
    status: EquipmentStatus;
    areaId: string;
    quantity: number;
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

  const toggleActionMenu = (equipmentId: string, button: HTMLButtonElement) => {
    if (openMenu?.equipmentId === equipmentId) {
      setOpenMenu(null);
      return;
    }

    const rect = button.getBoundingClientRect();
    const menuWidth = 168;
    const menuHeight = 132;
    const viewportPadding = 8;
    const alignedLeft = rect.right - menuWidth;
    const left = Math.max(
      viewportPadding,
      Math.min(alignedLeft, window.innerWidth - menuWidth - viewportPadding),
    );
    const alignedBottom = rect.bottom + 8;
    const top = alignedBottom + menuHeight > window.innerHeight - viewportPadding
      ? Math.max(viewportPadding, rect.top - menuHeight - 8)
      : alignedBottom;

    setOpenMenu({
      equipmentId,
      top,
      left,
    });
  };

  const handleOpenViewEquipment = (equipmentId: string) => {
    const target = equipment.find((item) => item.id === equipmentId);
    if (!target) {
      setError('Unable to locate the selected equipment item.');
      setOpenMenu(null);
      return;
    }

    setOpenMenu(null);
    setSelectedEquipment(target);
    setIsViewEquipmentModalOpen(true);
  };

  const handleOpenEditEquipment = (equipmentId: string) => {
    const target = equipment.find((item) => item.id === equipmentId);
    if (!target) {
      setError('Unable to locate the selected equipment item.');
      return;
    }

    setOpenMenu(null);
    setSelectedEquipment(target);
    setIsEditEquipmentModalOpen(true);
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    const target = equipment.find((item) => item.id === equipmentId);
    if (!target) {
      setError('Unable to locate the selected equipment item.');
      return;
    }

    setSelectedEquipment(target);
    setIsDeleteEquipmentModalOpen(true);
    setOpenMenu(null);
  };

  const handleDeleteEquipmentConfirm = async () => {
    if (!selectedEquipment) {
      return;
    }

    setIsDeletingEquipment(true);
    setError(null);

    try {
      const result = await deleteEquipmentAction({
        equipmentId: selectedEquipment.id,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      await loadEquipment();
      setIsDeleteEquipmentModalOpen(false);
      setSelectedEquipment(null);
    } catch {
      setError('Unable to delete equipment right now. Please try again.');
    } finally {
      setIsDeletingEquipment(false);
    }
  };

  const handleEditEquipmentSubmit = async (data: {
    equipmentId: string;
    status: EquipmentStatus;
    areaId: string;
  }) => {
    setIsUpdatingEquipment(true);
    setError(null);

    try {
      const result = await updateEquipmentAction(data);

      if (!result.ok) {
        setError(result.message);
        return false;
      }

      await loadEquipment();
      setIsEditEquipmentModalOpen(false);
      setSelectedEquipment(null);
      return true;
    } catch {
      setError('Unable to update equipment right now. Please try again.');
      return false;
    } finally {
      setIsUpdatingEquipment(false);
    }
  };

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        setOpenMenu(null);
        return;
      }

      if (target.closest('[data-row-action-trigger], [data-row-action-menu]')) {
        return;
      }

      setOpenMenu(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [openMenu]);

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
          <img class="logo" src="${logoUrl}" alt="Great Work logo" />
          <div class="meta"><strong>${item.areaName}</strong></div>
          <div class="qr-code">
            <img class="qr-image" src="${qrDataUrl}" alt="QR code" />
          </div>
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

  const handlePrintFilteredEquipment = async () => {
    if (filteredEquipment.length === 0) {
      setError('No filtered equipment records available to print.');
      return;
    }

    if (filteredEquipment.length > 300) {
      setError('Please narrow the filters to 300 items or fewer before printing.');
      return;
    }

    setError(null);

    let itemsWithQr: Array<EquipmentListItem & { qrDataUrl: string }> = [];
    try {
      const QRCodeLib = await import('qrcode');
      itemsWithQr = await Promise.all(
        filteredEquipment.map(async (item) => ({
          ...item,
          qrDataUrl: await QRCodeLib.toDataURL(item.qrCode, {
            width: 320,
            margin: 1,
            errorCorrectionLevel: 'H',
          }),
        })),
      );
    } catch {
      setError('Unable to generate bulk QR code images for printing right now.');
      return;
    }

    const printWindow = window.open('', '', 'width=1200,height=900');
    if (!printWindow) {
      setError('Please allow pop-ups to print filtered equipment QR labels.');
      return;
    }

    const logoUrl = new URL('/logo/GWlogo.webp', window.location.origin).toString();

    const labelsHtml = itemsWithQr
      .map(
        (item) => `
        <div class="label">
          <img class="logo" src="${logoUrl}" alt="Great Work logo" />
          <div class="meta"><strong>${item.areaName}</strong></div>
          <div class="qr-code">
            <img class="qr-image" src="${item.qrDataUrl}" alt="QR code" />
          </div>
        </div>
      `,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Print Filtered Equipment (${itemsWithQr.length})</title>
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
            min-height: 2.9in;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 12px;
          }
          .meta {
            width: 100%;
            text-align: center;
            color: #0f172a;
            font-size: 12px;
          }
          .sub {
            width: 100%;
            text-align: center;
            color: #64748b;
            font-size: 11px;
            font-family: monospace;
          }
          .qr-code {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .qr-image {
            width: 200px;
            height: 200px;
          }
          .logo {
            width: 0.88in;
            height: 0.18in;
            object-fit: contain;
          }
          .qr-value {
            font-family: monospace;
            font-size: 11px;
            color: #334155;
            word-break: break-all;
            text-align: center;
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
          <button class="print-btn" onclick="window.print()">Print ${itemsWithQr.length} Filtered QR Label(s)</button>
          <div class="print-note">Preview based on current filters in Equipment list.</div>
        </div>
        <div class="sheet">
          ${labelsHtml}
        </div>
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
            <button
              onClick={() => {
                void handlePrintFilteredEquipment();
              }}
              disabled={isLoadingEquipment || filteredEquipment.length === 0}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm"
            >
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

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-visible flex flex-col">
          <div className="p-4 sm:p-6 border-b border-stone-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by QR, SKU, model..."
                  className="placeholder-gray-600 text-gray-900 w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50"
                />
              </div>

              <div ref={filterPanelRef} className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen((open) => !open)}
                  className="relative inline-flex items-center justify-center p-2 border border-stone-200 rounded-lg bg-stone-50 text-stone-700 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  aria-label="Open filters"
                  title="Filters"
                >
                  <FilterIcon className="h-4 w-4" />
                  {activeFilterCount > 0 ? (
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-slate-900">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>

                {isFilterPanelOpen ? (
                  <div className="absolute right-0 mt-2 w-[min(90vw,28rem)] rounded-lg border border-stone-200 bg-white shadow-lg p-3 z-20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-stone-600">
                      Status
                      <select
                        value={activeTab}
                        onChange={(event) => setActiveTab(event.target.value as EquipmentStatus | 'ALL')}
                        className="mt-1 w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        aria-label="Filter by status"
                      >
                        {STATUS_TABS.map((tab) => (
                          <option key={tab.value} value={tab.value}>
                            {tab.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-xs font-medium text-stone-600">
                      Branch
                      <select
                        value={selectedBranchFilter}
                        onChange={(event) => setSelectedBranchFilter(event.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        aria-label="Filter by branch"
                      >
                        {branchFilterOptions.map((branchName) => (
                          <option key={branchName} value={branchName}>
                            {branchName === 'ALL' ? 'All Branches' : branchName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-xs font-medium text-stone-600 sm:col-span-2">
                      Area
                      <select
                        value={selectedAreaFilter}
                        onChange={(event) => setSelectedAreaFilter(event.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        aria-label="Filter by area"
                      >
                        {areaFilterOptions.map((areaName) => (
                          <option key={areaName} value={areaName}>
                            {areaName === 'ALL' ? 'All Areas' : areaName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-stone-600 mb-1">Equipment Model</p>
                      <div className="rounded-lg border border-stone-200 bg-stone-50 p-2 max-h-40 overflow-y-auto">
                        <label className="flex items-center gap-2 px-2 py-1.5 text-sm text-stone-700">
                          <input
                            type="checkbox"
                            checked={selectedModelFilters.length === 0}
                            onChange={() => setSelectedModelFilters([])}
                          />
                          All Models
                        </label>
                        <div className="my-1 border-t border-stone-200" />
                        {modelFilterOptions.map((modelName) => {
                          const checked = selectedModelFilters.includes(modelName);

                          return (
                            <label
                              key={modelName}
                              className="flex items-center gap-2 px-2 py-1.5 text-sm text-stone-700 hover:bg-white rounded"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  if (event.target.checked) {
                                    setSelectedModelFilters((prev) => [...prev, modelName]);
                                    return;
                                  }

                                  setSelectedModelFilters((prev) =>
                                    prev.filter((value) => value !== modelName),
                                  );
                                }}
                              />
                              {modelName}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('ALL');
                        setSelectedBranchFilter('ALL');
                        setSelectedAreaFilter('ALL');
                        setSelectedModelFilters([]);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 rounded-md hover:bg-stone-200"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFilterPanelOpen(false)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-stone-900 rounded-md hover:bg-stone-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
                ) : null}
              </div>
            </div>
          </div>

          {error ? <div className="px-6 py-3 text-sm text-rose-700 bg-rose-50 border-b border-rose-200">{error}</div> : null}

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
                  const qrDisplay = getEquipmentQrDisplay(item.sku, item.qrCode);

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenViewEquipment(item.id)}
                          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline text-left"
                          title="View equipment details"
                        >
                          <QrCodeIcon className="w-4 h-4 text-blue-600" />
                          {qrDisplay}
                        </button>
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
                          <button
                            type="button"
                            data-row-action-trigger
                            onClick={(event) => toggleActionMenu(item.id, event.currentTarget)}
                            className="text-stone-400 hover:text-stone-600 p-1 rounded-md hover:bg-stone-100 transition-colors"
                            aria-label={`Actions for ${item.sku ?? item.qrCode}`}
                            aria-expanded={openMenu?.equipmentId === item.id}
                          >
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

      <ViewEquipmentList
        isOpen={isViewEquipmentModalOpen}
        onClose={() => {
          setIsViewEquipmentModalOpen(false);
          setSelectedEquipment(null);
        }}
        equipment={selectedEquipment}
      />

      {openMenu
        ? createPortal(
          <div
            data-row-action-menu
            className="fixed z-120 w-42 rounded-lg border border-stone-200 bg-white py-1 shadow-xl"
            style={{
              top: `${openMenu.top}px`,
              left: `${openMenu.left}px`,
            }}
          >
            <button
              type="button"
              onClick={() => handleOpenViewEquipment(openMenu.equipmentId)}
              className="w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors inline-flex items-center gap-2"
            >
              <EyeIcon className="w-4 h-4" aria-hidden="true" />
              View
            </button>
            <button
              type="button"
              onClick={() => handleOpenEditEquipment(openMenu.equipmentId)}
              className="w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors inline-flex items-center gap-2"
            >
              <PencilIcon className="w-4 h-4" aria-hidden="true" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteEquipment(openMenu.equipmentId)}
              className="w-full px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 transition-colors inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Trash2Icon className="w-4 h-4" aria-hidden="true" />
              Delete
            </button>
          </div>,
          document.body,
        )
        : null}

      <RegisterEquipmentModal
        isOpen={isRegisterEquipmentModalOpen}
        onClose={() => setIsRegisterEquipmentModalOpen(false)}
        onSubmit={handleRegisterEquipmentSubmit}
        isSubmitting={isSubmittingEquipment}
        models={modelOptions}
        areas={areaOptions}
      />

      <EditEquipmentModal
        isOpen={isEditEquipmentModalOpen}
        onClose={() => {
          setIsEditEquipmentModalOpen(false);
          setSelectedEquipment(null);
        }}
        onSubmit={handleEditEquipmentSubmit}
        isSubmitting={isUpdatingEquipment}
        equipment={selectedEquipment}
        areas={areaOptions}
      />

      <DeleteEquipmentModal
        isOpen={isDeleteEquipmentModalOpen}
        onClose={() => {
          if (isDeletingEquipment) {
            return;
          }

          setIsDeleteEquipmentModalOpen(false);
          setSelectedEquipment(null);
        }}
        equipmentLabel={selectedEquipment?.sku ?? selectedEquipment?.qrCode ?? 'selected equipment'}
        onConfirm={handleDeleteEquipmentConfirm}
        isDeleting={isDeletingEquipment}
      />
    </div>
  );
}