/*
  Warnings:

  - You are about to drop the column `description` on the `equipment` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `equipment` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `equipment` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `equipment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serialNumber]` on the table `equipment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `equipmentModelId` to the `equipment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "equipment" DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "price",
DROP COLUMN "type",
ADD COLUMN     "equipmentModelId" TEXT NOT NULL,
ADD COLUMN     "serialNumber" TEXT;

-- CreateTable
CREATE TABLE "equipment_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "type" "EquipmentType" NOT NULL,
    "price" DECIMAL(10,2),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "equipment_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipment_models_sku_key" ON "equipment_models"("sku");

-- CreateIndex
CREATE INDEX "equipment_models_createdById_idx" ON "equipment_models"("createdById");

-- CreateIndex
CREATE INDEX "equipment_models_type_idx" ON "equipment_models"("type");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_serialNumber_key" ON "equipment"("serialNumber");

-- CreateIndex
CREATE INDEX "equipment_equipmentModelId_idx" ON "equipment"("equipmentModelId");

-- AddForeignKey
ALTER TABLE "equipment_models" ADD CONSTRAINT "equipment_models_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_equipmentModelId_fkey" FOREIGN KEY ("equipmentModelId") REFERENCES "equipment_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
