import { notFound } from 'next/navigation';
import React, { Suspense, lazy } from 'react';

import { fetchProductPrintByIdAction } from '@/app/_actions/product';

const ProductPrintView = lazy(async () => {
    const imported = await import('./product-print-view');
    return { default: imported.ProductPrintView };
});

type ProductPrintPageProps = {
    params: Promise<{ id: string }>;
};

export default async function ProductPrintPage({ params }: ProductPrintPageProps) {
    return (
        <Suspense fallback={<ProductPrintPageSkeleton />}>
            <ProductPrintContent params={params} />
        </Suspense>
    );
}

async function ProductPrintContent({ params }: ProductPrintPageProps) {
    const { id } = await params;
    const result = await fetchProductPrintByIdAction(id);

    if (!result.ok) {
        notFound();
    }

    return (
        <Suspense fallback={<ProductPrintPageSkeleton />}>
            <ProductPrintView item={result.item} />
        </Suspense>
    );
}

function ProductPrintPageSkeleton() {
    return (
        <main className="min-h-full bg-stone-100 p-6 animate-pulse" aria-hidden="true">
            <section className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <div className="h-7 w-40 rounded bg-stone-200" />
                    <div className="h-10 w-20 rounded bg-stone-200" />
                </div>

                <div className="rounded-xl border border-stone-300 p-6">
                    <div className="h-3 w-24 rounded bg-stone-200" />
                    <div className="mt-3 h-8 w-56 rounded bg-stone-200" />
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={`product-print-skeleton-${index}`}
                                className={index === 4 ? 'sm:col-span-2' : ''}
                            >
                                <div className="h-3 w-20 rounded bg-stone-200" />
                                <div className="mt-2 h-4 w-11/12 rounded bg-stone-200" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
