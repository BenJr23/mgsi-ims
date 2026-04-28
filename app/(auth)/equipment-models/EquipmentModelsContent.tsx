"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AddModelModal } from '../components/modals/AddModelModal';
import { ViewEquipmentModelModal } from '../components/modals/ViewEquipmentModelModal';
import { EditEquipmentModelModal } from '../components/modals/EditEquipmentModelModal';
import { DeleteEquipmentModelModal } from '../components/modals/DeleteEquipmentModelModal';
import {
    createEquipmentModelAction,
    updateEquipmentModelAction,
    deleteEquipmentModelAction,
    fetchEquipmentModelsAction,
    uploadEquipmentModelPhotoAction,
    type EquipmentModelListItem,
} from '@/app/_actions/equipmentmodel';
import {
    BoxIcon,
    SearchIcon,
    PlusIcon,
    FilterIcon,
    MoreVerticalIcon,
    EyeIcon,
    PencilIcon,
    Trash2Icon,
    CpuIcon,
    ArmchairIcon,
    WrenchIcon,
    ZapIcon,
    CircleDotIcon,
    CheckCircle2Icon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [isUpdatingModel, setIsUpdatingModel] = useState(false);
    const [isDeletingModel, setIsDeletingModel] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successNotice, setSuccessNotice] = useState<{
        title: string;
        message: string;
    } | null>(null);
    const [viewModel, setViewModel] = useState<EquipmentModelListItem | null>(null);
    const [editModel, setEditModel] = useState<EquipmentModelListItem | null>(null);
    const [deleteModel, setDeleteModel] = useState<EquipmentModelListItem | null>(null);
    const [openMenu, setOpenMenu] = useState<{
        modelId: string;
        top: number;
        left: number;
    } | null>(null);

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
        modelCode: string;
        description: string;
        type: EquipmentType;
        price: string;
        lifeExpectancy: string;
        photoFile: File | null;
    }) => {
        setIsSubmittingModel(true);
        setError(null);

        try {
            const { photoFile, ...modelData } = data;
            const result = await createEquipmentModelAction(modelData);

            if (!result.ok) {
                setError(result.message);
                return;
            }

            if (photoFile) {
                const uploadResult = await uploadEquipmentModelPhotoAction({
                    equipmentModelId: result.equipmentModelId,
                    photoFile,
                });

                if (!uploadResult.ok) {
                    setError(`Equipment model created, but photo upload failed: ${uploadResult.message}`);
                    return;
                }
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

    const toggleActionMenu = (modelId: string, button: HTMLButtonElement) => {
        if (openMenu?.modelId === modelId) {
            setOpenMenu(null);
            return;
        }

        const rect = button.getBoundingClientRect();
        const menuWidth = 168;
        const viewportPadding = 8;
        const alignedLeft = rect.right - menuWidth;
        const left = Math.max(
            viewportPadding,
            Math.min(alignedLeft, window.innerWidth - menuWidth - viewportPadding),
        );

        setOpenMenu({
            modelId,
            top: rect.bottom + 8,
            left,
        });
    };

    const handleOpenViewModel = (modelId: string) => {
        const selectedModel = models.find((model) => model.id === modelId);
        if (!selectedModel) {
            setError('Unable to locate the selected equipment model.');
            return;
        }

        setOpenMenu(null);
        setViewModel(selectedModel);
    };

    const handleOpenEditModel = (modelId: string) => {
        const selectedModel = models.find((model) => model.id === modelId);
        if (!selectedModel) {
            setError('Unable to locate the selected equipment model.');
            return;
        }

        setOpenMenu(null);
        setEditModel(selectedModel);
    };

    const handleOpenDeleteModel = (modelId: string) => {
        const selectedModel = models.find((model) => model.id === modelId);
        if (!selectedModel) {
            setError('Unable to locate the selected equipment model.');
            return;
        }

        setOpenMenu(null);
        setDeleteModel(selectedModel);
    };

    const handleEditModelSubmit = async (data: {
        name: string;
        modelCode: string;
        description: string;
        type: EquipmentType;
        price: string;
        lifeExpectancy: string;
        photoFile: File | null;
    }) => {
        if (!editModel) {
            return;
        }

        setIsUpdatingModel(true);
        setError(null);

        try {
            const { photoFile, ...modelData } = data;
            const result = await updateEquipmentModelAction({
                equipmentModelId: editModel.id,
                ...modelData,
            });

            if (!result.ok) {
                setError(result.message);
                return;
            }

            if (photoFile) {
                const uploadResult = await uploadEquipmentModelPhotoAction({
                    equipmentModelId: editModel.id,
                    photoFile,
                });

                if (!uploadResult.ok) {
                    setError(`Equipment model updated, but photo upload failed: ${uploadResult.message}`);
                    return;
                }
            }

            await loadEquipmentModels();
            setEditModel(null);
            setSuccessNotice({
                title: 'Edit successful',
                message: `Successfully saved changes for equipment model: ${data.name.trim() || editModel.name}`,
            });
        } catch {
            setError('Unable to update equipment model right now. Please try again.');
        } finally {
            setIsUpdatingModel(false);
        }
    };

    const handleDeleteModelConfirm = async () => {
        if (!deleteModel) {
            return;
        }

        const deletedModelName = deleteModel.name;

        setIsDeletingModel(true);
        setError(null);

        try {
            const result = await deleteEquipmentModelAction({
                equipmentModelId: deleteModel.id,
            });

            if (!result.ok) {
                setError(result.message);
                return;
            }

            await loadEquipmentModels();
            setDeleteModel(null);
            setSuccessNotice({
                title: 'Delete successful',
                message: `Successfully deleted equipment model: ${deletedModelName}`,
            });
        } catch {
            setError('Unable to delete equipment model right now. Please try again.');
        } finally {
            setIsDeletingModel(false);
        }
    };

    useEffect(() => {
        if (!openMenu) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target;

            if (!(target instanceof Element)) {
                setOpenMenu(null);
                return;
            }

            if (target.closest('[data-row-action-trigger], [data-row-action-menu]')) {
                return;
            }

            setOpenMenu(null);
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpenMenu(null);
            }
        };

        window.addEventListener('mousedown', handlePointerDown);
        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('mousedown', handlePointerDown);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [openMenu]);

    useEffect(() => {
        if (!successNotice) {
            return;
        }

        const timerId = window.setTimeout(() => {
            setSuccessNotice(null);
        }, 2800);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [successNotice]);

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full">
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
                                    className="placeholder-gray-600 text-gray-900 w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50"
                                />
                            </div>
                            <button className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors">
                                <FilterIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {error ? <div className="px-6 py-3 text-sm text-rose-700 bg-rose-50 border-b border-rose-200">{error}</div> : null}

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-stone-200">
                            <thead className="bg-stone-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Model
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Life Expectancy
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
                                {filtered.length > 0 ? (
                                    filtered.map((model) => {
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
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                                                    {model.modelCode || '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadge(model.type)}`}
                                                    >
                                                        {model.type.charAt(0) + model.type.slice(1).toLowerCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">{model.price || '—'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                                                    {model.lifeExpectancy != null ? `${model.lifeExpectancy} years` : '—'}
                                                </td>
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
                                                    <button
                                                        type="button"
                                                        data-row-action-trigger
                                                        onClick={(event) => toggleActionMenu(model.id, event.currentTarget)}
                                                        className="text-stone-400 hover:text-stone-600 p-1 rounded-md hover:bg-stone-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                                                        aria-label={`Actions for ${model.name}`}
                                                        aria-expanded={openMenu?.modelId === model.id}
                                                    >
                                                        <MoreVerticalIcon className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td className="px-6 py-10 text-center text-sm text-stone-500" colSpan={8}>
                                            {isLoading ? 'Loading models...' : 'No models found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {openMenu
                ? createPortal(
                    <div
                        data-row-action-menu
                        className="fixed z-120 w-42 rounded-lg border border-stone-200 bg-white py-1 shadow-xl"
                        style={{
                            top: `${openMenu.top}px`,
                            left: `${openMenu.left}px`,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => handleOpenViewModel(openMenu.modelId)}
                            className="w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors inline-flex items-center gap-2"
                        >
                            <EyeIcon className="w-4 h-4" aria-hidden="true" />
                            View
                        </button>
                        <button
                            type="button"
                            onClick={() => handleOpenEditModel(openMenu.modelId)}
                            className="w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors inline-flex items-center gap-2"
                        >
                            <PencilIcon className="w-4 h-4" aria-hidden="true" />
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => handleOpenDeleteModel(openMenu.modelId)}
                            className="w-full px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 transition-colors inline-flex items-center gap-2"
                        >
                            <Trash2Icon className="w-4 h-4" aria-hidden="true" />
                            Delete
                        </button>
                    </div>,
                    document.body,
                )
                : null}

            <AnimatePresence>
                {successNotice ? (
                    <motion.div
                        initial={{ x: 280, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 280, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                        className="fixed top-6 right-6 z-130 w-full max-w-sm rounded-xl border border-emerald-200 bg-white shadow-xl"
                        role="status"
                        aria-live="polite"
                    >
                        <div className="flex items-start gap-3 p-4">
                            <div className="rounded-full bg-emerald-100 p-1.5 text-emerald-600">
                                <CheckCircle2Icon className="w-4 h-4" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-emerald-700">{successNotice.title}</p>
                                <p className="text-sm text-stone-700 mt-0.5">{successNotice.message}</p>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AddModelModal
                isOpen={isAddModelModalOpen}
                onClose={() => setIsAddModelModalOpen(false)}
                onSubmit={handleAddModelSubmit}
            />

            <ViewEquipmentModelModal
                isOpen={Boolean(viewModel)}
                onClose={() => setViewModel(null)}
                model={viewModel}
            />

            <EditEquipmentModelModal
                isOpen={Boolean(editModel)}
                onClose={() => setEditModel(null)}
                model={editModel}
                isSubmitting={isUpdatingModel}
                onSubmit={handleEditModelSubmit}
            />

            <DeleteEquipmentModelModal
                isOpen={Boolean(deleteModel)}
                onClose={() => setDeleteModel(null)}
                modelName={deleteModel?.name ?? ''}
                onConfirm={handleDeleteModelConfirm}
                isDeleting={isDeletingModel}
            />
        </div>
    );
}
