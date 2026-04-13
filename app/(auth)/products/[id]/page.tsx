import { notFound } from 'next/navigation';
import React, { Suspense, lazy } from 'react';

import { fetchProductDetailByIdAction } from '@/app/_actions/product';

const ProductView = lazy(async () => {
    const imported = await import('./product-view');
    return { default: imported.ProductView };
});

type ProductViewPageProps = {
    params: Promise<{ id: string }>;
};

export default async function ProductViewPage({ params }: ProductViewPageProps) {
    return (
        <Suspense fallback={<ProductViewSkeleton />}>
            <ProductViewContent params={params} />
        </Suspense>
    );
}

async function ProductViewContent({ params }: ProductViewPageProps) {
    const { id } = await params;
    const result = await fetchProductDetailByIdAction(id);

    if (!result.ok) {
        notFound();
    }

    const { item } = result;

    return (
        <Suspense fallback={<ProductViewSkeleton />}>
            <ProductView item={item} />
        </Suspense>
    );
}

function ProductViewSkeleton() {
    return (
        <main className="min-h-full bg-stone-100 p-6 sm:p-8 lg:p-10 animate-pulse">
            <section className="mx-auto max-w-4xl rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-stone-200 bg-stone-900 px-6 py-6 sm:px-8">
                    <div className="h-3 w-24 rounded bg-stone-700" />
                    <div className="mt-3 h-8 w-56 rounded bg-stone-700" />
                    <div className="mt-2 h-4 w-40 rounded bg-stone-700" />
                </div>

                <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <article
                            key={`product-detail-skeleton-${index}`}
                            className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-4"
                        >
                            <div className="h-3 w-20 rounded bg-stone-200" />
                            <div className="mt-3 h-4 w-40 rounded bg-stone-200" />
                        </article>
                    ))}
                    <article className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 sm:col-span-2">
                        <div className="h-3 w-20 rounded bg-stone-200" />
                        <div className="mt-3 h-4 w-11/12 rounded bg-stone-200" />
                    </article>
                </div>
            </section>
        </main>
    );
}
