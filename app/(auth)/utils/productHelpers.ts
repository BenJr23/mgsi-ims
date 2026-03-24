/**
 * Product UI Helper Functions
 */

import type { Variants } from 'framer-motion';

/**
 * Get Tailwind CSS classes for product status badge
 */
export function getStatusStyles(status: string): string {
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

/**
 * Framer Motion animation variants for product grid
 */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
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
