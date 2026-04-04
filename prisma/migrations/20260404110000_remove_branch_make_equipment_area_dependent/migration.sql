/*
  Warnings:

  - You are about to drop the `branches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `branchId` on the `equipment` table. All the data in the column will be lost.
  - You are about to rename `areas.branchId` to `areas.externalBranchId`.
  - `equipment.areaId` is being made required. Rows with NULL `areaId` will fail this migration.

*/

-- DropForeignKey
ALTER TABLE "areas" DROP CONSTRAINT "areas_branchId_fkey";

-- DropForeignKey
ALTER TABLE "equipment" DROP CONSTRAINT "equipment_branchId_fkey";

-- DropForeignKey
ALTER TABLE "equipment" DROP CONSTRAINT "equipment_areaId_fkey";

-- DropForeignKey
ALTER TABLE "branches" DROP CONSTRAINT "branches_createdById_fkey";

-- DropIndex
DROP INDEX "areas_branchId_idx";

-- DropIndex
DROP INDEX "areas_branchId_roomCode_key";

-- DropIndex
DROP INDEX "equipment_branchId_idx";

-- AlterTable
ALTER TABLE "areas" RENAME COLUMN "branchId" TO "externalBranchId";

-- AlterTable
ALTER TABLE "equipment"
ALTER COLUMN "areaId" SET NOT NULL,
DROP COLUMN "branchId";

-- CreateIndex
CREATE INDEX "areas_externalBranchId_idx" ON "areas"("externalBranchId");

-- CreateIndex
CREATE UNIQUE INDEX "areas_externalBranchId_roomCode_key" ON "areas"("externalBranchId", "roomCode");

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropTable
DROP TABLE "branches";
