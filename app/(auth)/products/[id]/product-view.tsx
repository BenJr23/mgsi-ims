type ProductViewItem = {
  id: string;
  sku: string | null;
  qrCode: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  equipmentModel: {
    name: string;
    type: string;
    price: unknown;
  };
  createdBy: {
    name: string;
    email: string;
  };
};

type ProductViewProps = {
  item: ProductViewItem;
};

function formatStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

export function ProductView({ item }: ProductViewProps) {
  return (
    <main className="min-h-full bg-stone-100 p-6 sm:p-8 lg:p-10">
      <section className="mx-auto max-w-4xl rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-stone-200 bg-stone-900 px-6 py-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Product View</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{item.equipmentModel.name}</h1>
          <p className="mt-1 text-sm text-stone-300">Equipment ID: {item.id}</p>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <DetailCard label="SKU" value={item.sku ?? 'Not assigned'} />
          <DetailCard label="Status" value={formatStatus(item.status)} />
          <DetailCard label="Category" value={item.equipmentModel.type} />
          <DetailCard
            label="Price"
            value={item.equipmentModel.price ? `PHP ${Number(item.equipmentModel.price).toLocaleString()}` : 'Not set'}
          />
          <DetailCard label="Created By" value={item.createdBy.name} />
          <DetailCard label="Creator Email" value={item.createdBy.email} />
          <DetailCard label="Created At" value={formatDate(item.createdAt)} />
          <DetailCard label="Last Updated" value={formatDate(item.updatedAt)} />
          <DetailCard label="QR Code URL" value={item.qrCode} fullWidth />
        </div>
      </section>
    </main>
  );
}

type DetailCardProps = {
  label: string;
  value: string;
  fullWidth?: boolean;
};

function DetailCard({ label, value, fullWidth }: DetailCardProps) {
  return (
    <article className={`rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 ${fullWidth ? 'sm:col-span-2' : ''}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 wrap-break-word text-sm font-semibold text-stone-900">{value}</p>
    </article>
  );
}
