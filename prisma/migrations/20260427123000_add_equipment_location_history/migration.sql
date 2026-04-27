CREATE TYPE "EquipmentHistoryEvent" AS ENUM ('INITIAL', 'LOCATION_CHANGED', 'STATUS_CHANGED', 'LOCATION_AND_STATUS_CHANGED', 'DELETED');

CREATE TABLE "equipment_location_history" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "status" "EquipmentStatus" NOT NULL,
    "event" "EquipmentHistoryEvent" NOT NULL DEFAULT 'LOCATION_AND_STATUS_CHANGED',
    "changedById" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_location_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "equipment_location_history_equipmentId_idx" ON "equipment_location_history"("equipmentId");
CREATE INDEX "equipment_location_history_changedAt_idx" ON "equipment_location_history"("changedAt");
CREATE INDEX "equipment_location_history_changedById_idx" ON "equipment_location_history"("changedById");
CREATE INDEX "equipment_location_history_equipmentId_changedAt_idx" ON "equipment_location_history"("equipmentId", "changedAt");

ALTER TABLE "equipment_location_history"
ADD CONSTRAINT "equipment_location_history_equipmentId_fkey"
FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "equipment_location_history"
ADD CONSTRAINT "equipment_location_history_changedById_fkey"
FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "equipment_location_history" ("id", "equipmentId", "areaId", "status", "event", "changedById", "changedAt")
SELECT
    'hist_' || e."id",
    e."id",
    e."areaId",
    e."status",
    'INITIAL'::"EquipmentHistoryEvent",
    e."createdById",
    e."createdAt"
FROM "equipment" e
WHERE e."deletedAt" IS NULL;
