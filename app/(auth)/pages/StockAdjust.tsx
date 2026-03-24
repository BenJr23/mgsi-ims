'use client';

import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { PRODUCTS, Product } from '../constants/products';
import { MinusIcon, PlusIcon, ScanLineIcon } from 'lucide-react';

type StockAction = 'add' | 'remove';
type LogAction = StockAction | 'log';
type AdjustMode = 'scan' | 'manual';

interface ScanLogItem {
  id: string;
  productName: string;
  price: string;
  code: string;
  action: LogAction;
  quantity: number;
  stockAfter: number;
  timestamp: Date;
}

interface QueuedScan {
  value: string;
}

function getStatusByStock(stock: number): Product['status'] {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= 12) return 'Low Stock';
  return 'In Stock';
}

function normalizeLookupKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^id\s*[:#-]?\s*/i, '')
    .replace(/^sku\s*[:#-]?\s*/i, '')
    .replace(/^barcode\s*[:#-]?\s*/i, '')
    .replace(/^#/, '');
}

function buildLookupCandidates(value: string): string[] {
  const base = normalizeLookupKey(value);
  if (!base) return [];
  const compact = base.replace(/[\s-]/g, '');
  const alnumOnly = base.replace(/[^a-z0-9]/g, '');
  return Array.from(new Set([base, compact, alnumOnly].filter(Boolean)));
}

function splitBatchInput(value: string): string[] {
  return value
    .split(/[\r\n,;\t]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function formatRelativeTime(date: Date) {
  const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

export function StockAdjust() {
  const [inventory, setInventory] = useState<Product[]>(PRODUCTS);
  const [mode, setMode] = useState<AdjustMode>('scan');
  const [scanValue, setScanValue] = useState('');
  const [manualValue, setManualValue] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [action, setAction] = useState<StockAction>('add');
  const [manualQuantity, setManualQuantity] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [scanLogs, setScanLogs] = useState<ScanLogItem[]>([]);
  const [toggleCooldown, setToggleCooldown] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const isScanProcessingRef = useRef(false);
  const scanQueueRef = useRef<QueuedScan[]>([]);
  const actionRef = useRef<StockAction>('add');
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toggleCooldownRef = useRef(0);
  // Keep a live ref to inventory so we can read current stock synchronously
  const inventoryRef = useRef<Product[]>(PRODUCTS);

  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const handleSetAction = (newAction: StockAction) => {
    actionRef.current = newAction;
    setAction(newAction);

    scanQueueRef.current = [];
    isScanProcessingRef.current = false;
    setScanValue('');
    if (inputRef.current) inputRef.current.value = '';

    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    toggleCooldownRef.current = 5;
    setToggleCooldown(5);
    cooldownIntervalRef.current = setInterval(() => {
      setToggleCooldown((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        toggleCooldownRef.current = next;
        if (next === 0) {
          clearInterval(cooldownIntervalRef.current!);
          cooldownIntervalRef.current = null;
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        return next;
      });
    }, 1000);
  };

  const productIndex = useMemo(() => {
    const index = new Map<string, Product>();
    inventory.forEach((product) => {
      buildLookupCandidates(product.id).forEach((key) => index.set(key, product));
      buildLookupCandidates(`#${product.id}`).forEach((key) => index.set(key, product));
      buildLookupCandidates(product.barcode).forEach((key) => index.set(key, product));
      buildLookupCandidates(product.sku).forEach((key) => index.set(key, product));
    });
    return index;
  }, [inventory]);

  const findProduct = (value: string): Product | null => {
    const candidates = buildLookupCandidates(value);
    if (candidates.length === 0) return null;
    for (const candidate of candidates) {
      const match = productIndex.get(candidate);
      if (match) return match;
    }
    return null;
  };

  const appendLogEntry = (
    product: Product,
    codeUsed: string,
    actionType: LogAction,
    quantity: number,
    stockAfter: number
  ) => {
    const now = new Date();
    setScanLogs((prev) => [
      {
        id: `${now.getTime()}-${product.id}-${Math.random().toString(36).slice(2, 8)}`,
        productName: product.name,
        price: product.price,
        code: codeUsed || product.barcode || product.sku || product.id,
        action: actionType,
        quantity,
        stockAfter,
        timestamp: now,
      },
      ...prev,
    ]);
  };

  const applyStockChange = (
    product: Product,
    qty: number,
    codeUsed?: string,
    actionToApply: StockAction = actionRef.current
  ) => {
    const safeQty = Math.max(1, Math.floor(qty));

    // ✅ Read current stock SYNCHRONOUSLY from the ref, not from stale closure
    const currentItem = inventoryRef.current.find((i) => i.id === product.id);
    const currentStock = currentItem?.stock ?? product.stock;

    // ✅ Validate and compute result synchronously BEFORE any setState call
    if (actionToApply === 'remove' && safeQty > currentStock) {
      setErrorMessage(`Cannot remove ${safeQty}. Available stock is ${currentStock}.`);
      setFeedback('');
      return false;
    }

    const nextStock = actionToApply === 'add' ? currentStock + safeQty : currentStock - safeQty;
    const nextStatus = getStatusByStock(nextStock);

    // ✅ Now update state with the already-computed values
    setInventory((prev) =>
      prev.map((item) =>
        item.id === product.id
          ? { ...item, stock: nextStock, status: nextStatus }
          : item
      )
    );

    // Also update inventoryRef immediately so next scan reads correct stock
    inventoryRef.current = inventoryRef.current.map((item) =>
      item.id === product.id ? { ...item, stock: nextStock, status: nextStatus } : item
    );

    setSelectedProduct((prev) =>
      prev ? { ...prev, stock: nextStock, status: nextStatus } : prev
    );

    const actionLabel = actionToApply === 'add' ? 'Added' : 'Removed';
    setFeedback(`${actionLabel} ${safeQty} unit${safeQty > 1 ? 's' : ''} for ${product.name}. New stock: ${nextStock}.`);
    setErrorMessage('');
    appendLogEntry(product, codeUsed || '', actionToApply, safeQty, nextStock);
    return true;
  };

  const processNextScan = () => {
    while (scanQueueRef.current.length > 0) {
      const nextScan = scanQueueRef.current.shift();
      if (!nextScan) break;
      const matched = findProduct(nextScan.value);
      if (!matched) {
        setSelectedProduct(null);
        setErrorMessage(`No product found for code: ${nextScan.value}`);
        setFeedback('');
        continue;
      }
      setSelectedProduct(matched);
      applyStockChange(matched, 1, nextScan.value, actionRef.current);
    }
    isScanProcessingRef.current = false;
    inputRef.current?.focus();
  };

  const enqueueScanInput = (rawInput: string) => {
    if (toggleCooldownRef.current > 0) return;

    const scannedValue = rawInput.trim();
    setScanValue('');
    if (inputRef.current) inputRef.current.value = '';
    if (!scannedValue) {
      inputRef.current?.focus();
      return;
    }
    const parts = splitBatchInput(scannedValue);
    parts.forEach((part) => {
      if (part) scanQueueRef.current.push({ value: part });
    });
    if (!isScanProcessingRef.current) {
      isScanProcessingRef.current = true;
      processNextScan();
    }
  };

  const handleScanKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (event.repeat) return;
    const val = event.currentTarget.value;
    if (!val.trim()) return;
    enqueueScanInput(val);
  };

  const handleScanPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedValue = event.clipboardData.getData('text');
    enqueueScanInput(pastedValue);
  };

  const handleScanChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScanValue(event.target.value);
  };

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const matched = findProduct(manualValue);
    if (!matched) {
      setSelectedProduct(null);
      setErrorMessage('No product found. Enter a valid ID, SKU, or barcode.');
      setFeedback('');
      return;
    }
    setSelectedProduct(matched);
    const changed = applyStockChange(matched, manualQuantity, manualValue.trim(), actionRef.current);
    if (changed) {
      setManualValue('');
      setManualQuantity(1);
    }
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Stock Scanner</h1>
          <p className="text-sm text-stone-500 mt-1">
            Fast stock updates for continuous barcode or SKU input.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDE - SCAN CONTROLS */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-4 sm:p-6 space-y-5">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-stone-200 p-1 bg-stone-50">
                <button
                  type="button"
                  onClick={() => {
                    setMode('scan');
                    setErrorMessage('');
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                  className={`h-10 rounded-md text-sm font-medium transition-colors ${
                    mode === 'scan' ? 'bg-slate-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  Scan Mode
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('manual');
                    setErrorMessage('');
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                  className={`h-10 rounded-md text-sm font-medium transition-colors ${
                    mode === 'manual' ? 'bg-slate-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  Manual Mode
                </button>
              </div>

              {mode === 'scan' ? (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="scanInput" className="block text-sm font-medium text-stone-700 mb-1.5">
                      Scan Barcode / SKU / Product ID
                    </label>
                    <input
                      id="scanInput"
                      ref={inputRef}
                      type="text"
                      autoFocus
                      autoComplete="off"
                      spellCheck={false}
                      value={scanValue}
                      onChange={handleScanChange}
                      onKeyDown={handleScanKeyDown}
                      onPaste={handleScanPaste}
                      disabled={toggleCooldown > 0}
                      onBlur={() => {
                        if (toggleCooldown > 0) return;
                        setTimeout(() => inputRef.current?.focus(), 100);
                      }}
                      placeholder={
                        toggleCooldown > 0
                          ? `Switching action — ready in ${toggleCooldown}s...`
                          : 'Scan and press Enter'
                      }
                      className={`w-full h-12 px-3 rounded-lg border text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors ${
                        toggleCooldown > 0
                          ? 'border-amber-300 bg-amber-50 text-amber-700 cursor-not-allowed'
                          : 'border-stone-300'
                      }`}
                    />
                    <p className="text-xs text-stone-500 mt-1">
                      {toggleCooldown > 0
                        ? `⏳ Scanner locked for ${toggleCooldown}s after toggle to prevent wrong-action scans.`
                        : 'Single code: instant +1/-1 update. Multiple codes: process all.'}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="manualLookup" className="block text-sm font-medium text-stone-700 mb-1.5">
                      Product ID / SKU / Barcode
                    </label>
                    <input
                      id="manualLookup"
                      ref={inputRef}
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={manualValue}
                      onChange={(event) => setManualValue(event.target.value)}
                      placeholder="Type product code"
                      className="w-full h-11 px-3 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="manualQuantity" className="block text-sm font-medium text-stone-700 mb-1.5">
                      Quantity
                    </label>
                    <input
                      id="manualQuantity"
                      type="number"
                      min={1}
                      step={1}
                      value={manualQuantity}
                      onChange={(event) => setManualQuantity(Number(event.target.value) || 1)}
                      className="w-full h-11 px-3 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-11 px-4 rounded-lg bg-amber-500 text-slate-900 text-sm font-semibold hover:bg-amber-400 transition-colors"
                  >
                    Update Stock
                  </button>
                </form>
              )}

              {selectedProduct && (
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-stone-500">Name</p>
                      <p className="font-medium text-stone-900">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">ID / SKU</p>
                      <p className="font-medium text-stone-900">#{selectedProduct.id} / {selectedProduct.sku}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">Barcode</p>
                      <p className="font-medium text-stone-900">{selectedProduct.barcode}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">Current Stock</p>
                      <p className="font-semibold text-stone-900 text-base">{selectedProduct.stock}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-stone-700">Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetAction('add')}
                    className={`h-11 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors ${
                      action === 'add'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <PlusIcon className="w-4 h-4" /> Add
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAction('remove')}
                    className={`h-11 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors ${
                      action === 'remove'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <MinusIcon className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>

              {mode === 'scan' && (
                <div className={`h-11 px-3 rounded-lg border border-dashed text-xs flex items-center justify-center gap-2 transition-colors ${
                  toggleCooldown > 0
                    ? 'border-amber-300 bg-amber-50 text-amber-600'
                    : 'border-stone-300 bg-stone-50 text-stone-500'
                }`}>
                  <ScanLineIcon className="w-4 h-4" />
                  {toggleCooldown > 0
                    ? `Scanner locked — ready in ${toggleCooldown}s`
                    : 'Continuous scan enabled. Every Enter applies 1 unit.'}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {errorMessage}
                </div>
              )}

              {feedback && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {feedback}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE - SCAN LOG TABLE */}
          <div className="lg:col-span-2">
            <section className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
              <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-800">Scan Log</h2>
                <span className="text-xs text-stone-500">All scanned entries (Newest First)</span>
              </div>

              {scanLogs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center px-4 py-6 text-sm text-stone-500">
                  No scanned items yet.
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">SKU / Barcode</th>
                        <th className="text-left px-4 py-3 font-medium">Product Details</th>
                        <th className="text-left px-4 py-3 font-medium">Action</th>
                        <th className="text-left px-4 py-3 font-medium">New Qty</th>
                        <th className="text-left px-4 py-3 font-medium">Location</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanLogs.map((log) => (
                        <tr key={log.id} className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50/50 transition-colors">
                          <td className="px-4 py-4 text-stone-600 align-top">
                            B: {log.code}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="text-stone-900 font-medium">Title: {log.productName}</div>
                            <div className="text-stone-500">Price: {log.price}</div>
                          </td>
                          <td className="px-4 py-4 text-stone-600 align-top font-mono">
                            {log.action === 'add' ? `+ ${log.quantity}` : log.action === 'remove' ? `- ${log.quantity}` : 'read'}
                          </td>
                          <td className="px-4 py-4 text-stone-600 align-top">
                            {log.stockAfter}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="w-16 h-20 bg-black rounded" />
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center justify-center bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none uppercase w-fit">
                                success
                              </span>
                              <span className="text-[11px] text-stone-400 whitespace-nowrap">
                                {formatRelativeTime(log.timestamp)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}