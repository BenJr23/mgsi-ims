import React, { Children } from 'react';
import {
  PackageIcon,
  AlertTriangleIcon,
  DollarSignIcon,
  ClipboardListIcon } from
'lucide-react';
import { motion } from 'framer-motion';
const METRICS = [
{
  id: 1,
  name: 'Total SKUs',
  value: '2,847',
  icon: PackageIcon,
  iconBg: 'bg-stone-100',
  iconColor: 'text-stone-600'
},
{
  id: 2,
  name: 'Low Stock Alerts',
  value: '23',
  icon: AlertTriangleIcon,
  iconBg: 'bg-amber-100',
  iconColor: 'text-amber-600'
},
{
  id: 3,
  name: 'Inventory Value',
  value: '$1.2M',
  icon: DollarSignIcon,
  iconBg: 'bg-emerald-100',
  iconColor: 'text-emerald-600'
},
{
  id: 4,
  name: 'Pending Orders',
  value: '156',
  icon: ClipboardListIcon,
  iconBg: 'bg-blue-100',
  iconColor: 'text-blue-600'
}];

const containerVariants = {
  hidden: {
    opacity: 0
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
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
export function MetricsCards() {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="show">
      
      {METRICS.map((metric) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.id}
            variants={itemVariants}
            className="bg-white rounded-xl p-6 shadow-sm border border-stone-200 flex items-center gap-4">
            
            <div className={`p-3 rounded-full ${metric.iconBg} flex-shrink-0`}>
              <Icon
                className={`w-6 h-6 ${metric.iconColor}`}
                aria-hidden="true" />
              
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">
                {metric.name}
              </p>
              <p className="text-2xl font-bold text-stone-900 mt-0.5">
                {metric.value}
              </p>
            </div>
          </motion.div>);

      })}
    </motion.div>);

}