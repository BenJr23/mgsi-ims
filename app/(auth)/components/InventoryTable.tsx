"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  PlusIcon,
  DownloadIcon,
  FilterIcon,
  MoreVerticalIcon
} from
  'lucide-react';
import {
  fetchDashboardInventoryOverviewAction,
  type DashboardInventoryOverviewItem,
} from '@/app/_actions/dashboard';

type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
type StockStatusFilter = StockStatus | 'ALL';

function getStatusStyles(status: StockStatus) {
  switch (status) {
    case 'In Stock':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Low Stock':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Out of Stock':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-stone-100 text-stone-800 border-stone-200';
  }
}

function getProgressColor(status: StockStatus) {
  switch (status) {
    case 'In Stock':
      return 'bg-emerald-500';
    case 'Low Stock':
      return 'bg-amber-500';
    case 'Out of Stock':
      return 'bg-rose-500';
    default:
      return 'bg-stone-500';
  }
}

export function InventoryTable() {
  const router = useRouter();
  const [products, setProducts] = useState<DashboardInventoryOverviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>('ALL');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<{
    productId: string;
    top: number;
    left: number;
  } | null>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    if (statusFilter === 'ALL') {
      return products;
    }

    return products.filter((item) => item.status === statusFilter);
  }, [products, statusFilter]);

  const maxStock = Math.max(...filteredProducts.map((item) => item.stockQty), 1);

  const activeFilterCount = statusFilter === 'ALL' ? 0 : 1;

  const handleViewProduct = (productId: string) => {
    setOpenMenu(null);
    router.push(`/products/${productId}`);
  };

  const handlePrintProduct = (productId: string) => {
    setOpenMenu(null);
    router.push(`/products/${productId}/print`);
  };

  const toggleActionMenu = (productId: string, button: HTMLButtonElement) => {
    if (openMenu?.productId === productId) {
      setOpenMenu(null);
      return;
    }

    const rect = button.getBoundingClientRect();
    const menuWidth = 144;
    const viewportPadding = 8;
    const alignedLeft = rect.right - menuWidth;
    const left = Math.max(
      viewportPadding,
      Math.min(alignedLeft, window.innerWidth - menuWidth - viewportPadding),
    );

    setOpenMenu({
      productId,
      top: rect.bottom + 8,
      left,
    });
  };

  const handleExportPdf = async () => {
    if (filteredProducts.length === 0 || isExporting) {
      return;
    }

    setIsExporting(true);

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
      doc.text('Inventory Overview', 40, 40);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

      autoTable(doc, {
        startY: 72,
        head: [['Product', 'SKU', 'Category', 'Stock Qty', 'Status', 'Last Updated']],
        body: filteredProducts.map((product) => [
          product.name,
          product.sku,
          product.category,
          String(product.stockQty),
          product.status,
          product.lastUpdated,
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 6,
        },
        headStyles: {
          fillColor: [139, 29, 29],
          textColor: [255, 255, 255],
        },
      });

      doc.save('inventory-overview.pdf');
    } catch (exportError) {
      console.error('[InventoryTable] PDF export failed', exportError);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadInventoryOverview() {
      setIsLoading(true);

      const result = await fetchDashboardInventoryOverviewAction();

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        setError(result.message);
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setError(null);
      setProducts(result.items);
      setIsLoading(false);
    }

    void loadInventoryOverview();

    return () => {
      isMounted = false;
    };
  }, []);

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">
            Inventory Overview
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Manage your products, pricing, and stock levels.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
              <div className="absolute right-0 mt-2 w-[min(90vw,20rem)] rounded-lg border border-stone-200 bg-white shadow-lg p-3 z-20">
                <label className="block text-xs font-medium text-stone-600">
                  Status
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StockStatusFilter)}
                    className="mt-1 w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    aria-label="Filter by status"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </label>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
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
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isLoading || isExporting || filteredProducts.length === 0}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50">

            <DownloadIcon className="w-4 h-4" aria-hidden="true" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          {/* <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-50">

            <PlusIcon className="w-4 h-4" aria-hidden="true" />
            Add Product
          </button> */}
        </div>
      </div>



      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-stone-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">

                Product
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">

                SKU
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">

                Category
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">

                Stock Qty
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">

                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">

                Last Updated
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-stone-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-stone-500">
                  Loading inventory overview...
                </td>
              </tr>
            ) : null}

            {!isLoading && error ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-sm text-rose-700 bg-rose-50 border-y border-rose-200">
                  {error}
                </td>
              </tr>
            ) : null}

            {!isLoading && !error ? filteredProducts.map((product) => {
              const percentage = Math.min(100, Math.max(0, product.stockQty / maxStock * 100));

              return (
                <tr
                  key={product.id}
                  className="hover:bg-stone-50/80 transition-colors group">

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 shrink-0 bg-stone-100 rounded-md border border-stone-200 flex items-center justify-center">
                        <span className="text-stone-400 text-xs font-medium">
                          {product.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-stone-900">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-500 font-mono">
                      {product.sku}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-500">
                      {product.category}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-stone-900 w-10">
                        {product.stockQty.toLocaleString()}
                      </span>
                      <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getProgressColor(product.status)}`}
                          style={{
                            width: `${percentage}%`
                          }} />

                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(product.status)}`}>

                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                    {product.lastUpdated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      data-row-action-trigger
                      onClick={(event) => toggleActionMenu(product.id, event.currentTarget)}
                      className="text-stone-400 hover:text-stone-600 p-1 rounded-md hover:bg-stone-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                      aria-label={`Actions for ${product.name}`}
                      aria-expanded={openMenu?.productId === product.id}
                    >
                      <MoreVerticalIcon
                        className="w-5 h-5"
                        aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );

            }) : null}

            {!isLoading && !error && filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-stone-500">
                  No inventory records found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {openMenu ? createPortal(
        <div
          data-row-action-menu
          className="fixed z-120 w-36 rounded-lg border border-stone-200 bg-white py-1 shadow-xl"
          style={{
            top: `${openMenu.top}px`,
            left: `${openMenu.left}px`,
          }}
        >
          <button
            type="button"
            onClick={() => handleViewProduct(openMenu.productId)}
            className="w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => handlePrintProduct(openMenu.productId)}
            className="w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Print
          </button>
        </div>,
        document.body,
      ) : null}
    </div>);

}