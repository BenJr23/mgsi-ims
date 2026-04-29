ALTER TABLE "audit_sessions" ADD COLUMN IF NOT EXISTS "areaId" TEXT;

UPDATE "audit_sessions" s
SET "areaId" = src."areaId"
FROM (
  SELECT asi."sessionId" AS session_id, MIN(e."areaId") AS "areaId"
  FROM "audit_session_items" asi
  JOIN "equipment" e ON e."id" = asi."equipmentId"
  GROUP BY asi."sessionId"
) src
WHERE s."id" = src.session_id
  AND s."areaId" IS NULL;

UPDATE "audit_sessions"
SET "areaId" = '__UNASSIGNED_AREA__'
WHERE "areaId" IS NULL;

ALTER TABLE "audit_sessions" ALTER COLUMN "areaId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "audit_sessions_areaId_idx" ON "audit_sessions"("areaId");
