-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "stripe_session_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "orders_stripe_session_id_key" ON "orders"("stripe_session_id");
