import React from "react";
import { redirect } from "next/navigation";
import { NewSessionView } from "./new-session-view";

type NewSessionPageProps = {
  searchParams: Promise<{
    sessionId?: string;
  }>;
};

export const metadata = {
  title: "New Audit Session | IMS",
  description: "Start a new inventory audit session",
};

export default async function NewSessionPage({
  searchParams,
}: NewSessionPageProps) {
  const { sessionId } = await searchParams;

  if (!sessionId) {
    redirect("/audit-history");
  }

  return <NewSessionView sessionId={sessionId} />;
}
