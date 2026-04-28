"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CameraIcon,
} from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { AuditItemStatus } from "@/app/generated/prisma/enums";

type ScannerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (qrCode: string, status: AuditItemStatus, notes?: string) => void;
  onAddAnother: (qrCode: string, status: AuditItemStatus, notes?: string) => void;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scannedQR, setScannedQR] = useState<string | null>(null);
  const [status, setStatus] = useState<AuditItemStatus>("PASS");
  const [notes, setNotes] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);

  // Initialize camera on mount
  useEffect(() => {
    if (!isOpen) return;

    const initCamera = async () => {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (error) {
        console.error("Camera error:", error);
        setCameraError(
          "Unable to access camera. Please check permissions."
        );
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  // Scan QR code from video feed
  useEffect(() => {
    if (!isOpen || !videoRef.current || scannedQR) return;

    const codeReader = new BrowserMultiFormatReader();

    let isActive = true;

    const startScanning = async () => {
      try {
        const controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, error) => {
            if (!isActive) return;

            if (result) {
              setScannedQR(result.getText());
              scannerControlsRef.current?.stop();
              return;
            }

            if (error && error.name !== "NotFoundException") {
              console.debug("QR scan error:", error);
            }
          }
        );

        scannerControlsRef.current = controls;
      } catch (error) {
        console.error("QR scanner error:", error);
        setCameraError("Unable to start QR scanner. Please try again.");
      }
    };

    startScanning();

    return () => {
      isActive = false;
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
    };
  }, [isOpen, scannedQR]);

  const handleManualScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value) {
      setScannedQR(value);
      e.target.value = "";
    }
  };

  const handleSave = () => {
    if (scannedQR) {
      onSave(scannedQR, status, notes || undefined);
      resetModal();
    }
  };

  const handleAddAnother = () => {
    if (scannedQR) {
      onAddAnother(scannedQR, status, notes || undefined);
      resetModal();
    }
  };

  const resetModal = () => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    setScannedQR(null);
    setStatus("PASS");
    setNotes("");
  };

  const handleClose = () => {
    resetModal();
    onClose();
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
              {/* Camera */}
              {cameraError ? (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-center">
                  <AlertCircleIcon className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                  <p className="text-rose-800 text-sm font-medium">
                    {cameraError}
                  </p>
                </div>
              ) : (
                <div className="bg-stone-900 rounded-lg overflow-hidden aspect-video relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-yellow-400 m-12 rounded-lg pointer-events-none" />
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-2 rounded-lg">
                    <CameraIcon className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-medium">
                      Camera Open
                    </span>
                  </div>
                </div>
              )}

              {/* Manual Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700">
                  Or enter QR code manually:
                </label>
                <input
                  type="text"
                  placeholder="Scan or type QR code..."
                  onChange={handleManualScan}
                  autoFocus
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="h-2" />
            </>
          ) : (
            <>
              {/* Scanned Result */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                <CheckCircleIcon className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-emerald-800 font-medium">
                  QR Code Scanned Successfully
                </p>
                <p className="text-emerald-700 text-sm font-mono break-all">
                  {scannedQR}
                </p>
              </div>

              {/* Status Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700">
                  Item Status:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["PASS", "FAIL", "MISSING"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                        status === s
                          ? s === "PASS"
                            ? "bg-emerald-600 text-white"
                            : s === "FAIL"
                              ? "bg-rose-600 text-white"
                              : "bg-amber-600 text-white"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                    >
                      {s}
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
                onClick={resetModal}
                className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 font-medium rounded-lg hover:bg-stone-100 transition disabled:opacity-50"
                disabled={isLoading}
              >
                Rescan
              </button>
              <button
                onClick={handleAddAnother}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Add Another"}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                disabled={isLoading}
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
