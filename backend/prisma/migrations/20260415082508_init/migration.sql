/*
  Warnings:

  - Added the required column `clientId` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Made the column `subtotal` on table `invoices` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_projectId_fkey";

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "clientId" TEXT NOT NULL,
ALTER COLUMN "projectId" DROP NOT NULL,
ALTER COLUMN "issueDate" DROP DEFAULT,
ALTER COLUMN "subtotal" SET NOT NULL,
ALTER COLUMN "vatAmount" DROP DEFAULT,
ALTER COLUMN "vatRate" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "invoices_clientId_idx" ON "invoices"("clientId");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
