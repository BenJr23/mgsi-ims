/**
 * Product Card Component
 * Displays individual product with QR code, selection, and print options
 */

import React from 'react';
import { motion } from 'framer-motion';
import { PrinterIcon, Plus, Minus } from 'lucide-react';
import type { Variants } from 'framer-motion';

import type { Product } from '../constants/products';
import { getStatusStyles } from '../utils/productHelpers';
import { printSingleBarcode, printMultipleCopies } from '../utils/printQRCode';

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  selectedQuantity?: number;
  copyQuantity?: number;
  itemVariants: Variants;
  onToggleSelection: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onUpdateCopyQuantity: (id: string, qty: number) => void;
}

/**
 * QR Code Display Component
 * Generates and displays a QR code with the product ID
 */
function QRCodeDisplay({ productId }: { productId: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const renderQr = () => {
      const targetCanvas = canvasRef.current;
      const QRCodeLib = (window as any).QRCode;
      if (!targetCanvas || !QRCodeLib) return;

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);

      new QRCodeLib(tempContainer, {
        text: productId,
        width: 130,
        height: 130,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCodeLib.CorrectLevel.H
      });

      const sourceCanvas = tempContainer.querySelector('canvas') as HTMLCanvasElement | null;
      const sourceImage = tempContainer.querySelector('img') as HTMLImageElement | null;
      const ctx = targetCanvas.getContext('2d');
      if (!ctx) {
        document.body.removeChild(tempContainer);
        return;
      }

      ctx.clearRect(0, 0, 130, 130);
      if (sourceCanvas) {
        ctx.drawImage(sourceCanvas, 0, 0);
        document.body.removeChild(tempContainer);
        return;
      }

      if (sourceImage) {
        const drawImage = () => {
          ctx.clearRect(0, 0, 130, 130);
          ctx.drawImage(sourceImage, 0, 0, 130, 130);
          document.body.removeChild(tempContainer);
        };
        if (sourceImage.complete) {
          drawImage();
        } else {
          sourceImage.onload = drawImage;
        }
        return;
      }

      document.body.removeChild(tempContainer);
    };

    const existingScript = document.querySelector(
      'script[src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"]'
    ) as HTMLScriptElement | null;

    if ((window as any).QRCode) {
      renderQr();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener('load', renderQr, { once: true });
      return () => existingScript.removeEventListener('load', renderQr);
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.async = true;
    script.addEventListener('load', renderQr, { once: true });
    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', renderQr);
    };
  }, [productId]);

  return (
    <div className="mb-4 rounded-md border border-stone-200 bg-white p-2 flex items-center justify-center h-32 w-full">
      <canvas
        ref={canvasRef}
        width={130}
        height={130}
        className="max-w-full max-h-full"
      />
    </div>
  );
}

export function ProductCard({
  product,
  isSelected,
  selectedQuantity = 1,
  copyQuantity = 1,
  itemVariants,
  onToggleSelection,
  onUpdateQuantity,
  onUpdateCopyQuantity
}: ProductCardProps) {
  return (
    <motion.div
      key={product.id}
      variants={itemVariants}
      className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden group hover:shadow-md transition-shadow flex flex-col">
      
      {/* Selection Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(product.id)}
            className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
      </div>

      {/* Product Image Area */}
      <div className="h-40 bg-stone-100 flex items-center justify-center border-b border-stone-100 group-hover:bg-stone-200/50 transition-colors">
        <span className="text-4xl font-bold text-stone-300">
          {product.name.charAt(0)}
        </span>
      </div>

      {/* Product Details */}
      <div className="p-5 flex flex-col flex-1">
        {/* Name and Price */}
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-semibold text-stone-900 leading-tight line-clamp-2">
            {product.name}
          </h3>
          <span className="font-bold text-stone-900">{product.price}</span>
        </div>

        {/* SKU */}
        <p className="text-xs text-stone-500 font-mono mb-4">{product.sku}</p>

        {/* QR Code Display */}
        <QRCodeDisplay productId={product.id} />

        {/* Bulk Print Quantity Control (visible when selected) */}
        {isSelected && (
          <div className="mb-3 flex items-center gap-2 bg-blue-50 p-2 rounded-md border border-blue-200">
            <span className="text-xs font-medium text-blue-700">Qty:</span>
            <button
              onClick={() => onUpdateQuantity(product.id, selectedQuantity - 1)}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded">
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              min="1"
              value={selectedQuantity}
              onChange={(e) => onUpdateQuantity(product.id, parseInt(e.target.value) || 1)}
              className="w-10 text-center text-sm font-semibold border-0 bg-transparent text-blue-700 focus:outline-none"
            />
            <button
              onClick={() => onUpdateQuantity(product.id, selectedQuantity + 1)}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Footer: Category, Status, and Print Controls */}
        <div className="mt-auto flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded-md">
            {product.category}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(
              product.status
            )}`}>
            {product.status}
          </span>

          {/* Copy Quantity & Print Button */}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
              <input
                type="number"
                min="1"
                max="100"
                value={copyQuantity}
                onChange={(e) => onUpdateCopyQuantity(product.id, parseInt(e.target.value) || 1)}
                className="w-12 text-center text-xs font-semibold border-0 bg-transparent text-emerald-700 focus:outline-none"
                title="Number of copies to print"
              />
            </div>
            <button
              onClick={() => printMultipleCopies(product, copyQuantity)}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
              title="Print multiple copies of this barcode">
              <PrinterIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
