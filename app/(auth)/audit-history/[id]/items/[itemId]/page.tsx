import React from "react";
import { ItemDetailView } from "./item-detail-view";

type ItemDetailPageProps = {
  params: Promise<{
    id: string;
    itemId: string;
  }>;
};

export const metadata = {
  title: "Item Details | IMS",
  description: "View details of a scanned audit item",
};

export default async function ItemDetailPage({
  params,
}: ItemDetailPageProps) {
  const { id, itemId } = await params;

  return <ItemDetailView sessionId={id} itemId={itemId} />;
}
