'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  PackageIcon,
  CheckCircle2Icon,
  PhilippinePeso,
  WrenchIcon
} from
  'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { fetchDashboardMetricsAction } from '@/app/_actions/dashboard';

type MetricsValues = {
  totalSkus: string;
  inventoryValue: string;
  equipmentAvailability: string;
  maintenanceLoad: string;
};

function MetricsCardsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`metric-loading-skeleton-${index}`}
          className="bg-white rounded-xl p-6 shadow-sm border border-stone-200 animate-pulse">

          <div className="h-4 w-24 rounded bg-stone-200" />
          <div className="mt-3 h-7 w-20 rounded bg-stone-200" />
        </div>
      ))}
    </div>
  );
}

const DEFAULT_METRICS: MetricsValues = {
  totalSkus: '--',
  inventoryValue: '--',
  equipmentAvailability: '--',
  maintenanceLoad: '--',
};

const containerVariants: Variants = {
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

const itemVariants: Variants = {
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
  const [values, setValues] = useState<MetricsValues>(DEFAULT_METRICS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadMetrics() {
      setIsLoading(true);

      const result = await fetchDashboardMetricsAction();

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        setIsLoading(false);
        return;
      }

      setValues(result.metrics);
      setIsLoading(false);
    }

    void loadMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo(
    () => [
      {
        id: 1,
        name: 'Total SKUs',
        value: values.totalSkus,
        icon: PackageIcon,
        iconBg: 'bg-stone-100',
        iconColor: 'text-stone-600',
      },
      {
        id: 2,
        name: 'Inventory Value',
        value: values.inventoryValue,
        icon: PhilippinePeso,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      },
      {
        id: 3,
        name: 'Equipment Availability',
        value: values.equipmentAvailability,
        icon: CheckCircle2Icon,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      },
      {
        id: 4,
        name: 'Maintenance Load',
        value: values.maintenanceLoad,
        icon: WrenchIcon,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
      },
    ],
    [values],
  );

  if (isLoading) {
    return <MetricsCardsLoadingSkeleton />;
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="show">

      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.id}
            variants={itemVariants}
            className="bg-white rounded-xl p-6 shadow-sm border border-stone-200 flex items-center gap-4">

            <div className={`p-3 rounded-full ${metric.iconBg} shrink-0`}>
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