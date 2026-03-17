import React, { Children } from 'react';
import { TopBar } from '../components/TopBar';
import { PlusIcon, SearchIcon, FilterIcon } from 'lucide-react';
import { motion } from 'framer-motion';
const CATEGORIES = [
'All',
'Electronics',
'Kitchen',
'Apparel',
'Footwear',
'Accessories'];

const PRODUCTS = [
{
  id: '1',
  name: 'Wireless Bluetooth Headphones',
  sku: 'SKU-7291',
  price: '$79.99',
  category: 'Electronics',
  status: 'In Stock'
},
{
  id: '2',
  name: 'Organic Cotton T-Shirt (M)',
  sku: 'SKU-4518',
  price: '$24.99',
  category: 'Apparel',
  status: 'Low Stock'
},
{
  id: '3',
  name: 'Stainless Steel Water Bottle',
  sku: 'SKU-8834',
  price: '$19.99',
  category: 'Kitchen',
  status: 'Out of Stock'
},
{
  id: '4',
  name: 'USB-C Charging Cable 6ft',
  sku: 'SKU-2201',
  price: '$12.99',
  category: 'Electronics',
  status: 'In Stock'
},
{
  id: '5',
  name: 'Bamboo Cutting Board Set',
  sku: 'SKU-6673',
  price: '$34.99',
  category: 'Kitchen',
  status: 'Low Stock'
},
{
  id: '6',
  name: 'Running Shoes (Size 10)',
  sku: 'SKU-3390',
  price: '$89.99',
  category: 'Footwear',
  status: 'In Stock'
},
{
  id: '7',
  name: 'Ceramic Coffee Mug 12oz',
  sku: 'SKU-1147',
  price: '$14.99',
  category: 'Kitchen',
  status: 'Out of Stock'
},
{
  id: '8',
  name: 'Laptop Sleeve 15 inch',
  sku: 'SKU-5562',
  price: '$29.99',
  category: 'Accessories',
  status: 'In Stock'
}];

const containerVariants = {
  hidden: {
    opacity: 0
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};
const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};
function getStatusStyles(status: string) {
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
export function Products() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />

      <main className="flex-1 p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Products
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Browse and manage your product catalog
            </p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
            <PlusIcon className="w-4 h-4" aria-hidden="true" />
            Add Product
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
          <div className="flex overflow-x-auto pb-2 lg:pb-0 gap-2 hide-scrollbar">
            {CATEGORIES.map((cat, i) =>
            <button
              key={cat}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${i === 0 ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
              
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
                className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50" />
              
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
          
          {PRODUCTS.map((product) =>
          <motion.div
            key={product.id}
            variants={itemVariants}
            className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden group hover:shadow-md transition-shadow cursor-pointer flex flex-col">
            
              <div className="h-40 bg-stone-100 flex items-center justify-center border-b border-stone-100 group-hover:bg-stone-200/50 transition-colors">
                <span className="text-4xl font-bold text-stone-300">
                  {product.name.charAt(0)}
                </span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-semibold text-stone-900 leading-tight line-clamp-2">
                    {product.name}
                  </h3>
                  <span className="font-bold text-stone-900">
                    {product.price}
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-mono mb-4">
                  {product.sku}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded-md">
                    {product.category}
                  </span>
                  <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(product.status)}`}>
                  
                    {product.status}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>);

}