"use client";

type ProductPrintViewProps = {
    item: {
        id: string;
        sku: string | null;
        status: string;
        qrCode: string;
        modelName: string;
        modelType: string;
    };
};

export function ProductPrintView({ item }: ProductPrintViewProps) {
    return (
        <main className="min-h-full bg-stone-100 p-6 print:bg-white print:p-0">
            <section className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
                <div className="mb-6 flex items-center justify-between print:hidden">
                    <h1 className="text-xl font-semibold text-stone-900">Print Product</h1>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
                    >
                        Print
                    </button>
                </div>

                <div className="rounded-xl border border-stone-300 p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Product Label</p>
                    <h2 className="mt-2 text-2xl font-bold text-stone-900">{item.modelName}</h2>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <InfoRow label="Equipment ID" value={item.id} />
                        <InfoRow label="SKU" value={item.sku ?? 'Not assigned'} />
                        <InfoRow label="Category" value={item.modelType} />
                        <InfoRow label="Status" value={item.status} />
                        <InfoRow label="QR URL" value={item.qrCode} spanTwo />
                    </div>
                </div>
            </section>
        </main>
    );
}

type InfoRowProps = {
    label: string;
    value: string;
    spanTwo?: boolean;
};

function InfoRow({ label, value, spanTwo }: InfoRowProps) {
    return (
        <div className={spanTwo ? 'sm:col-span-2' : ''}>
            <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
            <p className="mt-1 wrap-break-word text-sm font-medium text-stone-900">{value}</p>
        </div>
    );
}
