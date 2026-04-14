'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '../components/ProductCard';
import { PlusIcon, SearchIcon, FilterIcon, PrinterIcon, CheckIcon } from 'lucide-react';

// Constants and utilities
import { CATEGORIES, PRODUCTS } from '../constants/products';
import { containerVariants, itemVariants } from '../utils/productHelpers';
import { generateBulkPrintHTML, resolveQrBaseUrl } from '../utils/printQRCode';

export default function ProductsPage() {
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map());
  const [copyQuantities, setCopyQuantities] = useState<Map<string, number>>(new Map());

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Map(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.set(productId, 1);
    }
    setSelectedProducts(newSelected);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return;
    const newSelected = new Map(selectedProducts);
    newSelected.set(productId, quantity);
    setSelectedProducts(newSelected);
  };

  const updateCopyQuantity = (productId: string, quantity: number) => {
    const newCopyQties = new Map(copyQuantities);
    newCopyQties.set(productId, quantity);
    setCopyQuantities(newCopyQties);
  };

  const handleBulkPrint = () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product to print');
      return;
    }

    const printWindow = window.open('', '', 'width=1200,height=800');
    if (!printWindow) {
      alert('Please allow pop-ups to print barcodes');
      return;
    }

    const qrBaseUrl = resolveQrBaseUrl(window.location.origin);
    const html = generateBulkPrintHTML(PRODUCTS, selectedProducts, qrBaseUrl);
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === PRODUCTS.length) {
      setSelectedProducts(new Map());
    } else {
      const newSelected = new Map();
      PRODUCTS.forEach(product => {
        newSelected.set(product.id, 1);
      });
      setSelectedProducts(newSelected);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Products
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Browse and manage your product catalog
            </p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
              <PlusIcon className="w-4 h-4" aria-hidden="true" />
              Add Product
            </button>
            
            {selectedProducts.size > 0 && (
              <button
                onClick={handleBulkPrint}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm">
                <PrinterIcon className="w-4 h-4" aria-hidden="true" />
                Print Selected ({selectedProducts.size})
              </button>
            )}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
          <div className="flex overflow-x-auto pb-2 lg:pb-0 gap-2 hide-scrollbar items-center">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-stone-100 hover:bg-stone-200 transition-colors border border-stone-200">
              <CheckIcon className="w-4 h-4" />
              Select All
            </button>
            <div className="w-px h-6 bg-stone-200" />
            {CATEGORIES.map((cat, i) =>
              <button
                key={cat}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  i === 0 ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}>
                {cat}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 lg:w-64">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search catalog..."
                className="placeholder-gray-600 text-gray-900 w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50"
              />
            </div>
            <button className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors">
              <FilterIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show">
          {PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isSelected={selectedProducts.has(product.id)}
              selectedQuantity={selectedProducts.get(product.id) || 1}
              copyQuantity={copyQuantities.get(product.id) || 1}
              itemVariants={itemVariants}
              onToggleSelection={toggleProductSelection}
              onUpdateQuantity={updateQuantity}
              onUpdateCopyQuantity={updateCopyQuantity}
            />
          ))}
        </motion.div>
      </main>
    </div>
  );
}
