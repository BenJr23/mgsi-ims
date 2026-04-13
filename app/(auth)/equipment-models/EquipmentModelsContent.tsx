"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { AddModelModal } from '../components/modals/AddModelModal';
import {
    createEquipmentModelAction,
    fetchEquipmentModelsAction,
    type EquipmentModelListItem,
} from '@/app/_actions/equipmentmodel';
import {
    BoxIcon,
    SearchIcon,
    PlusIcon,
    FilterIcon,
    MoreVerticalIcon,
    CpuIcon,
    ArmchairIcon,
    WrenchIcon,
    ZapIcon,
    CircleDotIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

type EquipmentType = 'FURNITURE' | 'ELECTRONICS' | 'APPLIANCE' | 'TOOL' | 'OTHER';

const TYPE_TABS: { label: string; value: EquipmentType | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Furniture', value: 'FURNITURE' },
    { label: 'Electronics', value: 'ELECTRONICS' },
    { label: 'Appliance', value: 'APPLIANCE' },
    { label: 'Tool', value: 'TOOL' },
    { label: 'Other', value: 'OTHER' },
];

function getTypeIcon(type: EquipmentType) {
    switch (type) {
        case 'FURNITURE':
            return ArmchairIcon;
        case 'ELECTRONICS':
            return CpuIcon;
        case 'APPLIANCE':
            return ZapIcon;
        case 'TOOL':
            return WrenchIcon;
        case 'OTHER':
            return CircleDotIcon;
    }
}

function getTypeBadge(type: EquipmentType) {
    switch (type) {
        case 'FURNITURE':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'ELECTRONICS':
            return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        case 'APPLIANCE':
            return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'TOOL':
            return 'bg-stone-100 text-stone-800 border-stone-200';
        case 'OTHER':
            return 'bg-stone-100 text-stone-600 border-stone-200';
    }
}

export default function EquipmentModelsContent() {
    const [models, setModels] = useState<EquipmentModelListItem[]>([]);
    const [activeTab, setActiveTab] = useState<EquipmentType | 'ALL'>('ALL');
    const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false);
    const [isSubmittingModel, setIsSubmittingModel] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadEquipmentModels = async () => {
        setIsLoading(true);

        try {
            const result = await fetchEquipmentModelsAction();

            if (!result.ok) {
                setError(result.message);
                setModels([]);
                return;
            }

            setModels(result.models);
        } catch {
            setError('Unable to load equipment models right now.');
            setModels([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadEquipmentModels();
    }, []);

    const handleAddModelSubmit = async (data: {
        name: string;
        description: string;
        type: EquipmentType;
        price: string;
    }) => {
        setIsSubmittingModel(true);
        setError(null);

        try {
            const result = await createEquipmentModelAction(data);

            if (!result.ok) {
                setError(result.message);
                return;
            }

            await loadEquipmentModels();
            setIsAddModelModalOpen(false);
        } catch {
            setError('Unable to create equipment model right now. Please try again.');
        } finally {
            setIsSubmittingModel(false);
        }
    };

    const metrics = useMemo(() => {
        const furnitureCount = models.filter((model) => model.type === 'FURNITURE').length;
        const electronicsCount = models.filter((model) => model.type === 'ELECTRONICS').length;
        const totalUnits = models.reduce((sum, model) => sum + model.unitCount, 0);

        return [
            {
                name: 'Total Models',
                value: String(models.length),
                icon: BoxIcon,
                color: 'text-stone-600',
                bg: 'bg-stone-100',
            },
            {
                name: 'Furniture',
                value: String(furnitureCount),
                icon: ArmchairIcon,
                color: 'text-blue-600',
                bg: 'bg-blue-100',
            },
            {
                name: 'Electronics',
                value: String(electronicsCount),
                icon: CpuIcon,
                color: 'text-indigo-600',
                bg: 'bg-indigo-100',
            },
            {
                name: 'Total Units',
                value: totalUnits.toLocaleString(),
                icon: BoxIcon,
                color: 'text-emerald-600',
                bg: 'bg-emerald-100',
            },
        ];
    }, [models]);

    const filtered = activeTab === 'ALL' ? models : models.filter((m) => m.type === activeTab);

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full">
                {error ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {error}
                    </div>
                ) : null}

                {isLoading ? (
                    <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500">
                        Loading equipment models...
                    </div>
                ) : null}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Equipment Models</h1>
                        <p className="text-sm text-stone-500 mt-1">Manage your equipment catalog and templates</p>
                    </div>
                    <button
                        disabled={isSubmittingModel}
                        onClick={() => setIsAddModelModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm"
                    >
                        <PlusIcon className="w-4 h-4" aria-hidden="true" />
                        Add Model
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((metric, i) => {
                        const Icon = metric.icon;
                        return (
                            <motion.div
                                key={metric.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 flex items-center gap-4"
                            >
                                <div className={`p-3 rounded-full ${metric.bg} shrink-0`}>
                                    <Icon className={`w-5 h-5 ${metric.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-stone-500">{metric.name}</p>
                                    <p className="text-xl font-bold text-stone-900 mt-0.5">{metric.value}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
                    <div className="p-4 sm:p-6 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex overflow-x-auto gap-1 hide-scrollbar">
                            {TYPE_TABS.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setActiveTab(tab.value)}
                                    className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.value ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 lg:w-64">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                <input
                                    type="text"
                                    placeholder="Search models..."
                                    className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50"
                                />
                            </div>
                            <button className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors">
                                <FilterIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-stone-200">
                            <thead className="bg-stone-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Model
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Units
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-stone-100">
                                {filtered.map((model) => {
                                    const TypeIcon = getTypeIcon(model.type);
                                    return (
                                        <tr key={model.id} className="hover:bg-stone-50/80 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 shrink-0 bg-stone-100 rounded-lg border border-stone-200 flex items-center justify-center">
                                                        <TypeIcon className="w-5 h-5 text-stone-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-stone-900">{model.name}</p>
                                                        <p className="text-xs text-stone-500 max-w-xs truncate">{model.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadge(model.type)}`}
                                                >
                                                    {model.type.charAt(0) + model.type.slice(1).toLowerCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">{model.price || '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-stone-600">{model.unitCount}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <p className="text-sm text-stone-500">{model.createdAt}</p>
                                                    <p className="text-xs text-stone-400">{model.createdBy}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button className="text-stone-400 hover:text-stone-600 p-1 rounded-md hover:bg-stone-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                                    <MoreVerticalIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <AddModelModal
                isOpen={isAddModelModalOpen}
                onClose={() => setIsAddModelModalOpen(false)}
                onSubmit={handleAddModelSubmit}
            />
        </div>
    );
}
