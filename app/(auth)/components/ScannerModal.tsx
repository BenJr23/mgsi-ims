"use client";

import React, { useEffect, useRef, useState } from "react";
import { XIcon, CheckCircleIcon, AlertCircleIcon, CameraIcon } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { EquipmentLookupDetail } from "@/app/_actions/equipment";
import type { AuditItemStatus } from "@/app/generated/prisma/enums";

type ScannerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipmentId: string, status: AuditItemStatus, notes?: string) => void | Promise<void>;
  onAddAnother: (equipmentId: string, status: AuditItemStatus, notes?: string) => void | Promise<void>;
  isLoading?: boolean;
};

export function ScannerModal({
  isOpen,
  onClose,
  onSave,
  onAddAnother,
  isLoading = false,
}: ScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scannedQR, setScannedQR] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [status, setStatus] = useState<AuditItemStatus>("PASS");
  const [notes, setNotes] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [equipmentDetail, setEquipmentDetail] = useState<EquipmentLookupDetail | null>(null);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);
  const [isEquipmentLoading, setIsEquipmentLoading] = useState(false);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);
  const detectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A counter to trigger re-scanning after "Add Another"
  const [scanSession, setScanSession] = useState(0);

  const stopScanner = () => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
  };

  const getSkuFromScan = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
      const parsed = new URL(trimmed);
      const segments = parsed.pathname.split("/").filter(Boolean);
      const lastSegment = segments.at(-1);
      const sku = lastSegment ? decodeURIComponent(lastSegment) : null;
      console.log("[ScannerModal] Parsed SKU from URL", {
        raw: value,
        sku,
        path: parsed.pathname,
      });
      return sku;
    } catch {
      const cleaned = trimmed.split(/[?#]/)[0];
      const segments = cleaned.split("/").filter(Boolean);
      const lastSegment = segments.at(-1) ?? cleaned;
      const sku = lastSegment ? decodeURIComponent(lastSegment) : null;
      console.log("[ScannerModal] Parsed SKU from raw value", {
        raw: value,
        cleaned,
        sku,
      });
      return sku;
    }
  };

  // Single effect owns the entire camera + scanner lifecycle
  useEffect(() => {
    if (!isOpen || scannedQR || isDetecting) return;

    let isActive = true;

    const codeReader = new BrowserMultiFormatReader();

    const startScanning = async () => {
      try {
        const controls = await codeReader.decodeFromVideoDevice(
          undefined, // uses default camera (environment-facing on mobile)
          videoRef.current!,
          (result, error) => {
            if (!isActive) return;

            if (result) {
              const text = result.getText();
              console.log("[ScannerModal] QR detected", { text });
              setIsDetecting(true);
              stopScanner();
              detectTimeoutRef.current = setTimeout(() => {
                setScannedQR(text);
                setIsDetecting(false);
              }, 350);
            } else if (error && error.name !== "NotFoundException") {
              console.debug("QR scan error:", error);
            }
          }
        );

        if (isActive) {
          scannerControlsRef.current = controls;
        } else {
          controls.stop(); // already unmounted, clean up immediately
        }
      } catch (error) {
        console.error("QR scanner error:", error);
        if (isActive) {
          setCameraError("Unable to access camera. Please check permissions.");
        }
      }
    };

    startScanning();

    return () => {
      isActive = false;
      stopScanner();
      if (detectTimeoutRef.current) {
        clearTimeout(detectTimeoutRef.current);
        detectTimeoutRef.current = null;
      }
    };
    // scanSession bumps when user hits "Add Another" to force a fresh scan
  }, [isOpen, scannedQR, scanSession]);

  useEffect(() => {
    if (!scannedQR) return;

    const sku = getSkuFromScan(scannedQR);
    if (!sku) {
      console.warn("[ScannerModal] Unable to parse SKU", { scannedQR });
      const resetId = setTimeout(() => {
        setEquipmentDetail(null);
        setEquipmentError("Unable to read a SKU from this QR code.");
        setIsEquipmentLoading(false);
      }, 0);
      return () => clearTimeout(resetId);
    }

    let isActive = true;
    const startId = setTimeout(() => {
      if (!isActive) return;
      setIsEquipmentLoading(true);
      setEquipmentError(null);
      console.log("[ScannerModal] Starting equipment lookup", { sku });
    }, 0);

    const timeoutId = setTimeout(() => {
      if (!isActive) return;
      setIsEquipmentLoading(false);
      setEquipmentDetail(null);
      setEquipmentError("Lookup is taking too long. Please rescan or try again.");
      console.warn("[ScannerModal] Equipment lookup timed out", { sku });
    }, 6000);

    fetch(`/api/equipment/lookup?sku=${encodeURIComponent(sku)}`, {
      method: "GET",
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json();
        return { ok: response.ok, payload };
      })
      .then(({ ok, payload }) => {
        if (!isActive) return;
        console.log("[ScannerModal] Equipment lookup result", payload);
        if (ok && payload?.ok) {
          setEquipmentDetail(payload.equipment as EquipmentLookupDetail);
        } else {
          setEquipmentDetail(null);
          setEquipmentError(payload?.message ?? "No equipment found for this SKU.");
        }
      })
      .catch((error) => {
        if (!isActive) return;
        console.error("[ScannerModal] Equipment lookup failed", error);
        setEquipmentDetail(null);
        setEquipmentError("Unable to look up equipment right now.");
      })
      .finally(() => {
        clearTimeout(timeoutId);
        if (isActive) setIsEquipmentLoading(false);
      });

    return () => {
      isActive = false;
      clearTimeout(startId);
      clearTimeout(timeoutId);
    };
  }, [scannedQR]);

  const handleSave = async () => {
    if (scannedQR && equipmentDetail) {
      await onSave(equipmentDetail.id, status, notes || undefined);
      handleClose();
    }
  };

  const handleAddAnother = async () => {
    if (scannedQR && equipmentDetail) {
      await onAddAnother(equipmentDetail.id, status, notes || undefined);
      // Reset form state and bump session to restart the scanner effect
      setScannedQR(null);
      setIsDetecting(false);
      setEquipmentDetail(null);
      setEquipmentError(null);
      setIsEquipmentLoading(false);
      setNotes("");
      setScanSession((s) => s + 1);
    }
  };

  const handleRescan = () => {
    setScannedQR(null);
    setIsDetecting(false);
    setEquipmentDetail(null);
    setEquipmentError(null);
    setIsEquipmentLoading(false);
    setNotes("");
    setScanSession((s) => s + 1);
  };

  const handleClose = () => {
    stopScanner();
    setScannedQR(null);
    setIsDetecting(false);
    setEquipmentDetail(null);
    setEquipmentError(null);
    setIsEquipmentLoading(false);
    setStatus("PASS");
    setNotes("");
    onClose();
  };

  const getStatusButtonClasses = (value: AuditItemStatus) => {
    if (status === value) {
      if (value === "PASS") return "bg-emerald-600 text-white";
      if (value === "FAIL") return "bg-rose-600 text-white";
      return "bg-amber-600 text-white";
    }

    return "bg-stone-100 text-stone-700 hover:bg-stone-200";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-stone-900">Scan Item</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-stone-100 rounded-lg transition"
            disabled={isLoading}
          >
            <XIcon className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!scannedQR ? (
            <>
              {cameraError ? (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-center">
                  <AlertCircleIcon className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                  <p className="text-rose-800 text-sm font-medium">{cameraError}</p>
                </div>
              ) : isDetecting ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-blue-800 text-sm font-medium">QR detected, loading details...</p>
                </div>
              ) : (
                <div className="bg-stone-900 rounded-lg overflow-hidden aspect-square relative">
                  {/* video is always mounted so the ref is stable for decodeFromVideoDevice */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-2 rounded-lg">
                    <CameraIcon className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-medium">Camera Open</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Scanned Result */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                <CheckCircleIcon className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-emerald-800 font-medium">QR Code Scanned Successfully</p>
                <p className="text-emerald-700 text-sm font-mono break-all">{scannedQR}</p>
              </div>

              {isEquipmentLoading ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-blue-800 text-sm font-medium">Looking up equipment...</p>
                </div>
              ) : equipmentError ? (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-center">
                  <AlertCircleIcon className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                  <p className="text-rose-800 text-sm font-medium">{equipmentError}</p>
                </div>
              ) : equipmentDetail ? (
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-stone-500 text-xs">Equipment</p>
                    <span className="text-xs font-medium text-stone-700">{equipmentDetail.status}</span>
                  </div>
                  <p className="text-stone-900 font-semibold">{equipmentDetail.modelName}</p>
                  <p className="text-stone-600 text-sm">{equipmentDetail.modelType}</p>
                  <div className="text-xs text-stone-600">
                    <span className="font-medium">SKU:</span> {equipmentDetail.sku}
                  </div>
                  <div className="text-xs text-stone-600">
                    <span className="font-medium">Location:</span> {equipmentDetail.areaName} • {equipmentDetail.branchName}
                  </div>
                </div>
              ) : null}

              {/* Status Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700">Audit Result:</label>
                <p className="text-xs text-stone-500">
                  This result stays active for the next scans until you change it.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(["PASS", "FAIL", "MISSING"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`px-3 py-2 rounded-lg font-medium text-sm transition ${getStatusButtonClasses(s)}`}
                    >
                      {s === "PASS" ? "Pass" : s === "FAIL" ? "Failed" : "Missing"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700">
                  Notes (optional):
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this item..."
                  rows={3}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 p-6 flex gap-2 bg-stone-50 sticky bottom-0">
          {!scannedQR ? (
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 font-medium rounded-lg hover:bg-stone-100 transition disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
          ) : (
            <>
              <button
                onClick={handleRescan}
                className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 font-medium rounded-lg hover:bg-stone-100 transition disabled:opacity-50"
                disabled={isLoading}
              >
                Rescan
              </button>
              <button
                onClick={handleAddAnother}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                disabled={isLoading || isEquipmentLoading || !equipmentDetail}
              >
                {isLoading ? "Saving..." : "Add Another"}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                disabled={isLoading || isEquipmentLoading || !equipmentDetail}
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}