/*
  Warnings:

  - You are about to drop the column `buildingId` on the `areas` table. All the data in the column will be lost.
  - You are about to drop the `buildings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[branchId,roomCode]` on the table `areas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `branchId` to the `areas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "areas" DROP CONSTRAINT "areas_buildingId_fkey";

-- DropForeignKey
ALTER TABLE "buildings" DROP CONSTRAINT "buildings_createdById_fkey";

-- DropForeignKey
ALTER TABLE "equipment" DROP CONSTRAINT "equipment_branchId_fkey";

-- DropIndex
DROP INDEX "areas_buildingId_idx";

-- DropIndex
DROP INDEX "areas_buildingId_roomCode_key";

-- AlterTable
ALTER TABLE "areas" DROP COLUMN "buildingId",
ADD COLUMN     "branchId" TEXT NOT NULL;

-- DropTable
DROP TABLE "buildings";

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "branchCode" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_branchCode_key" ON "branches"("branchCode");

-- CreateIndex
CREATE INDEX "branches_createdById_idx" ON "branches"("createdById");

-- CreateIndex
CREATE INDEX "areas_branchId_idx" ON "areas"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "areas_branchId_roomCode_key" ON "areas"("branchId", "roomCode");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
