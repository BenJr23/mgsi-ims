-- AlterTable
ALTER TABLE "equipment_models" ADD COLUMN "photoUrl" TEXT;

-- Backfill existing model photos from equipment rows
UPDATE "equipment_models" em
SET "photoUrl" = source."photoUrl"
FROM (
  SELECT DISTINCT ON ("equipmentModelId") "equipmentModelId", "photoUrl"
  FROM "equipment"
  WHERE "photoUrl" IS NOT NULL
  ORDER BY "equipmentModelId", "createdAt" DESC
) AS source
WHERE em."id" = source."equipmentModelId";

-- AlterTable
ALTER TABLE "equipment" DROP COLUMN "photoUrl";
