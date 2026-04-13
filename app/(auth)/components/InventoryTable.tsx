import {
  PlusIcon,
  DownloadIcon,
  FilterIcon,
  MoreVerticalIcon
} from
  'lucide-react';

type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stockQty: number;
  status: StockStatus;
  lastUpdated: string;
}

const INVENTORY_DATA: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    sku: 'SKU-7291',
    category: 'Electronics',
    stockQty: 342,
    status: 'In Stock',
    lastUpdated: '2h ago'
  },
  {
    id: '2',
    name: 'Organic Cotton T-Shirt (M)',
    sku: 'SKU-4518',
    category: 'Apparel',
    stockQty: 12,
    status: 'Low Stock',
    lastUpdated: '5h ago'
  },
  {
    id: '3',
    name: 'Stainless Steel Water Bottle',
    sku: 'SKU-8834',
    category: 'Kitchen',
    stockQty: 0,
    status: 'Out of Stock',
    lastUpdated: '1d ago'
  },
  {
    id: '4',
    name: 'USB-C Charging Cable 6ft',
    sku: 'SKU-2201',
    category: 'Electronics',
    stockQty: 1205,
    status: 'In Stock',
    lastUpdated: '2d ago'
  },
  {
    id: '5',
    name: 'Bamboo Cutting Board Set',
    sku: 'SKU-6673',
    category: 'Kitchen',
    stockQty: 8,
    status: 'Low Stock',
    lastUpdated: '3d ago'
  },
  {
    id: '6',
    name: 'Running Shoes (Size 10)',
    sku: 'SKU-3390',
    category: 'Footwear',
    stockQty: 67,
    status: 'In Stock',
    lastUpdated: '4d ago'
  },
  {
    id: '7',
    name: 'Ceramic Coffee Mug 12oz',
    sku: 'SKU-1147',
    category: 'Kitchen',
    stockQty: 0,
    status: 'Out of Stock',
    lastUpdated: '1w ago'
  },
  {
    id: '8',
    name: 'Laptop Sleeve 15 inch',
    sku: 'SKU-5562',
    category: 'Accessories',
    stockQty: 189,
    status: 'In Stock',
    lastUpdated: '1w ago'
  }];

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
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors">

            <FilterIcon className="w-4 h-4" aria-hidden="true" />
            Filter
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors">

            <DownloadIcon className="w-4 h-4" aria-hidden="true" />
            Export
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">

            <PlusIcon className="w-4 h-4" aria-hidden="true" />
            Add Product
          </button>
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
            {INVENTORY_DATA.map((product) => {
              // Calculate a mock percentage for the progress bar (max 1500 for demo purposes)
              const maxStock = 1500;
              const percentage = Math.min(
                100,
                Math.max(0, product.stockQty / maxStock * 100)
              );
              return (
                <tr
                  key={product.id}
                  className="hover:bg-stone-50/80 transition-colors group">

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-stone-100 rounded-md border border-stone-200 flex items-center justify-center">
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
                      className="text-stone-400 hover:text-stone-600 p-1 rounded-md hover:bg-stone-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                      aria-label={`Actions for ${product.name}`}>

                      <MoreVerticalIcon
                        className="w-5 h-5"
                        aria-hidden="true" />

                    </button>
                  </td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>
    </div>);

}