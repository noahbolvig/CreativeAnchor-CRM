-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 21.0;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "vatNumber" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "reverseCharge" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subtotal" DOUBLE PRECISION,
ADD COLUMN     "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 21.0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'Netherlands',
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "vatNumber" TEXT;
