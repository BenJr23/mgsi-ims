/**
 * Product Constants and Categories
 */

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  category: string;
  status: string;
}

export const CATEGORIES = [
  'All',
  'Electronics',
  'Kitchen',
  'Apparel',
  'Footwear',
  'Accessories'
];

export const PRODUCTS: Product[] = [
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
  }
];
