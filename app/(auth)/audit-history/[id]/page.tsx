import React from "react";
import { SessionDetailView } from "./session-detail-view";

type SessionDetailPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export const metadata = {
    title: "Audit Session Details | IMS",
    description: "View audit session details and scanned items",
};

export default async function SessionDetailPage({
    params,
}: SessionDetailPageProps) {
    const { id } = await params;

    return <SessionDetailView sessionId={id} />;
}
