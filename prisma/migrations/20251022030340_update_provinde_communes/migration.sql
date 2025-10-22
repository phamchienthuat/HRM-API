/*
  Warnings:

  - Added the required column `decree` to the `Communes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Communes" ADD COLUMN     "decree" VARCHAR(100) NOT NULL,
ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "createdBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Provinde" ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "createdBy" DROP NOT NULL;
