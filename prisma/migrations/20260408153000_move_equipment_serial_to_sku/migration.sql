-- Move the existing equipment serial number into the new SKU column.
ALTER TABLE "equipment" RENAME COLUMN "serialNumber" TO "sku";

-- Recreate the unique index with the new column name so Prisma stays aligned.
DROP INDEX IF EXISTS "equipment_serialNumber_key";
CREATE UNIQUE INDEX "equipment_sku_key" ON "equipment"("sku");

-- Remove SKU from equipment models.
DROP INDEX IF EXISTS "equipment_models_sku_key";
ALTER TABLE "equipment_models" DROP COLUMN "sku";
