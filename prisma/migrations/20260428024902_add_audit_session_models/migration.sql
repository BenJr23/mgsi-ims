-- CreateEnum
CREATE TYPE "AuditSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditItemStatus" AS ENUM ('PASS', 'FAIL', 'MISSING');

-- CreateTable
CREATE TABLE "audit_sessions" (
    "id" TEXT NOT NULL,
    "status" "AuditSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "startedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_session_items" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "status" "AuditItemStatus" NOT NULL DEFAULT 'PASS',
    "notes" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_session_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_sessions_status_idx" ON "audit_sessions"("status");

-- CreateIndex
CREATE INDEX "audit_sessions_startedById_idx" ON "audit_sessions"("startedById");

-- CreateIndex
CREATE INDEX "audit_sessions_startedAt_idx" ON "audit_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "audit_session_items_sessionId_idx" ON "audit_session_items"("sessionId");

-- CreateIndex
CREATE INDEX "audit_session_items_equipmentId_idx" ON "audit_session_items"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "audit_session_items_sessionId_equipmentId_key" ON "audit_session_items"("sessionId", "equipmentId");

-- AddForeignKey
ALTER TABLE "audit_sessions" ADD CONSTRAINT "audit_sessions_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_session_items" ADD CONSTRAINT "audit_session_items_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "audit_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_session_items" ADD CONSTRAINT "audit_session_items_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
