import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PRODUCTS } from '../(auth)/constants/products';

type ItemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ItemPage({ params }: ItemPageProps) {
  const { id } = await params;
  const product = PRODUCTS.find((item) => item.id === id);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Scanned Item</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900 sm:text-3xl">{product.name}</h1>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailRow label="ID" value={product.id} />
          <DetailRow label="SKU" value={product.sku} />
          <DetailRow label="Barcode" value={product.barcode} />
          <DetailRow label="Category" value={product.category} />
          <DetailRow label="Price" value={product.price} />
          <DetailRow label="Stock" value={String(product.stock)} />
          <DetailRow label="Status" value={product.status} />
        </div>

        <div className="mt-8 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-stone-900">{value}</p>
    </div>
  );
}
