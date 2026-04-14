"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { AddAreaModal } from '../components/modals/AddAreaModal';
import { EditAreaModal } from '../components/modals/EditAreaModal';
import { DeleteAreaModal } from '../components/modals/DeleteAreaModal';
import { fetchBranchesAction, type BranchItem } from '@/app/_actions/branches';
import { createAreaAction, deleteAreaAction, updateAreaAction } from '@/app/_actions/area';
import {
  Building2Icon,
  DoorOpenIcon,
  PackageIcon,
  SearchIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Edit2Icon,
  Trash2Icon } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
export default function BranchesAreasPage() {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [addAreaBranch, setAddAreaBranch] = useState<BranchItem | null>(null);
  const [editArea, setEditArea] = useState<{ branchName: string; areaId: string; areaName: string; roomCode: string; } | null>(null);
  const [deleteArea, setDeleteArea] = useState<{ branchName: string; areaId: string; areaName: string; } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadBranches() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchBranchesAction();

        if (!isActive) {
          return;
        }

        if (!result.ok) {
          setError(result.message);
          setBranches([]);
          return;
        }

        setBranches(result.branches);
        setExpandedBranch(result.branches[0]?.id ?? null);
      } catch {
        if (isActive) {
          setError('Unable to load branches and areas right now.');
          setBranches([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadBranches();

    return () => {
      isActive = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const totalAreas = branches.reduce((sum, branch) => sum + (branch.areas?.length ?? 0), 0);
    const totalEquipment = branches.reduce((sum, branch) => sum + (branch.equipCount ?? 0), 0);

    return [
      {
        name: 'Total Branches',
        value: String(branches.length),
        icon: Building2Icon,
        color: 'text-stone-600',
        bg: 'bg-stone-100',
      },
      {
        name: 'Total Areas',
        value: String(totalAreas),
        icon: DoorOpenIcon,
        color: 'text-blue-600',
        bg: 'bg-blue-100',
      },
      {
        name: 'Total Equipment',
        value: totalEquipment.toLocaleString(),
        icon: PackageIcon,
        color: 'text-emerald-600',
        bg: 'bg-emerald-100',
      },
    ];
  }, [branches]);

  const toggleBranch = (id: string) => {
    setExpandedBranch(expandedBranch === id ? null : id);
  };

  const getAreaCount = (branch: BranchItem) => branch.areaCount ?? branch.areas?.length ?? 0;

  const handleEditAreaSubmit = async (data: { roomName: string; roomCode: string; }) => {
    if (!editArea) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateAreaAction({
        areaId: editArea.areaId,
        roomName: data.roomName,
        roomCode: data.roomCode?.trim() ? data.roomCode.trim() : null,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      const refreshResult = await fetchBranchesAction();

      if (refreshResult.ok) {
        setBranches(refreshResult.branches);
        setEditArea(null);
      } else {
        setError('Area updated but failed to refresh list. Please reload the page.');
      }
    } catch {
      setError('Failed to update area. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAreaConfirm = async () => {
    if (!deleteArea) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await deleteAreaAction({
        areaId: deleteArea.areaId,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      const refreshResult = await fetchBranchesAction();

      if (refreshResult.ok) {
        setBranches(refreshResult.branches);
        setDeleteArea(null);
      } else {
        setError('Area deleted but failed to refresh list. Please reload the page.');
      }
    } catch {
      setError('Failed to delete area. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAreaSubmit = async (data: { roomName: string; roomCode: string; }) => {
    if (!addAreaBranch) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await createAreaAction({
        externalBranchId: addAreaBranch.id,
        roomName: data.roomName,
        roomCode: data.roomCode?.trim() ? data.roomCode.trim() : null,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      // Refetch branches to get the updated list with new area
      setIsLoading(true);
      const refreshResult = await fetchBranchesAction();

      if (refreshResult.ok) {
        setBranches(refreshResult.branches);
      } else {
        setError('Area created but failed to refresh list. Please reload the page.');
      }
    } catch {
      setError('Failed to create area. Please try again.');
    } finally {
      setIsLoading(false);
      setAddAreaBranch(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Branches & Areas
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Manage your branches, rooms, and locations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search branches..."
                className="placeholder-gray-600 text-gray-900 w-full sm:w-64 pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white shadow-sm" />

            </div>
            <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
              <PlusIcon className="w-4 h-4" />
              Add Branch
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.name}
                initial={{
                  opacity: 0,
                  y: 20
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: i * 0.1
                }}
                className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 flex items-center gap-4">
                
                <div className={`p-3 rounded-full ${metric.bg} shrink-0`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-500">
                    {metric.name}
                  </p>
                  <p className="text-xl font-bold text-stone-900 mt-0.5">
                    {metric.value}
                  </p>
                </div>
              </motion.div>);

          })}
        </div>

        {/* Branches List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
              Loading branches and areas...
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {!isLoading && !error && branches.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
              No branches returned from the API yet.
            </div>
          ) : null}

          {branches.map((branch, i) => {
            const isExpanded = expandedBranch === branch.id;
            const areas = branch.areas ?? [];
            return (
              <motion.div
                key={branch.id}
                initial={{
                  opacity: 0,
                  y: 20
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: i * 0.1
                }}
                className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                
                {/* Branch Header (Clickable) */}
                <button
                  onClick={() => toggleBranch(branch.id)}
                  className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-stone-50 transition-colors text-left gap-4">
                  
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="p-2.5 bg-stone-100 rounded-lg text-stone-500">
                      <Building2Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-stone-900">
                          {branch.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-xs font-mono font-medium rounded border border-stone-200">
                          {branch.code}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500">
                        {branch.address ?? 'No address'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 ml-14 sm:ml-0">
                    <div className="flex items-center gap-4 text-sm text-stone-500">
                      <span className="flex items-center gap-1.5">
                        <DoorOpenIcon className="w-4 h-4" /> {getAreaCount(branch)}{' '}
                        areas
                      </span>
                      <span className="flex items-center gap-1.5">
                        <PackageIcon className="w-4 h-4" />{' '}
                        {(branch.equipCount ?? 0).toLocaleString()} equip
                      </span>
                    </div>
                    <div className="text-stone-400">
                      {isExpanded ?
                      <ChevronUpIcon className="w-5 h-5" /> :

                      <ChevronDownIcon className="w-5 h-5" />
                      }
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded &&
                  <motion.div
                    initial={{
                      height: 0,
                      opacity: 0
                    }}
                    animate={{
                      height: 'auto',
                      opacity: 1
                    }}
                    exit={{
                      height: 0,
                      opacity: 0
                    }}
                    transition={{
                      duration: 0.2
                    }}
                    className="border-t border-stone-200 bg-stone-50/50">
                    
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold text-stone-900">
                            Areas in {branch.name}
                          </h4>
                          <button
                            onClick={() => setAddAreaBranch(branch)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 transition-colors shadow-sm"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                            Add Area
                          </button>
                        </div>

                        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-stone-200">
                            <thead className="bg-stone-50">
                              <tr>
                                <th
                                scope="col"
                                className="px-4 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                
                                  Area Name
                                </th>
                                <th
                                scope="col"
                                className="px-4 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                
                                  Area Code
                                </th>
                                <th
                                scope="col"
                                className="px-4 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                
                                  Equipment
                                </th>
                                <th
                                scope="col"
                                className="relative px-4 py-2.5">
                                
                                  <span className="sr-only">Actions</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {areas.map((area) => {
                              const maxEquip = 300;
                              const percentage = Math.min(
                                100,
                                Math.max(
                                  0,
                                  (area.equipCount ?? 0) / maxEquip * 100
                                )
                              );
                              const isLocalArea = area.source === 'local';
                              return (
                                <tr
                                  key={area.id}
                                  className="hover:bg-stone-50/80 transition-colors group">
                                  
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-stone-900">
                                      {area.name}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-stone-500 font-mono">
                                      {area.code}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm text-stone-600 w-8">
                                          {area.equipCount ?? 0}
                                        </span>
                                        <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                          <div
                                          className="h-full bg-emerald-500 rounded-full"
                                          style={{
                                            width: `${percentage}%`
                                          }} />
                                        
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                      {isLocalArea ? (
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            className="text-stone-400 hover:text-blue-600 p-1 rounded transition-colors"
                                            aria-label="Edit Area"
                                            onClick={() => setEditArea({
                                              branchName: branch.name,
                                              areaId: area.id,
                                              areaName: area.name,
                                              roomCode: area.code ?? '',
                                            })}
                                          >
                                            <Edit2Icon className="w-4 h-4" />
                                          </button>
                                          <button
                                            className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors"
                                            aria-label="Delete Area"
                                            onClick={() => setDeleteArea({
                                              branchName: branch.name,
                                              areaId: area.id,
                                              areaName: area.name,
                                            })}
                                          >
                                            <Trash2Icon className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-stone-400">API area</span>
                                      )}
                                    </td>
                                  </tr>);

                            })}
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-4 pt-4 border-t border-stone-200">
                          <button className="text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors">
                            Edit Branch
                          </button>
                          <button className="text-xs font-medium text-rose-500 hover:text-rose-700 transition-colors">
                            Delete Branch
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  }
                </AnimatePresence>
              </motion.div>);

          })}
        </div>
      </main>

      <AddAreaModal
        isOpen={Boolean(addAreaBranch)}
        onClose={() => setAddAreaBranch(null)}
        branchName={addAreaBranch?.name ?? ''}
        onSubmit={handleAddAreaSubmit}
      />
      <EditAreaModal
        isOpen={Boolean(editArea)}
        onClose={() => setEditArea(null)}
        branchName={editArea?.branchName ?? ''}
        areaName={editArea?.areaName ?? ''}
        roomName={editArea?.areaName ?? ''}
        roomCode={editArea?.roomCode ?? ''}
        onSubmit={handleEditAreaSubmit}
      />
      <DeleteAreaModal
        isOpen={Boolean(deleteArea)}
        onClose={() => setDeleteArea(null)}
        branchName={deleteArea?.branchName ?? ''}
        areaName={deleteArea?.areaName ?? ''}
        onConfirm={handleDeleteAreaConfirm}
      />
    </div>);

}