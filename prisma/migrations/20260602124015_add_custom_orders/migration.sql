-- CreateTable
CREATE TABLE "custom_orders" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'nouveau',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "garment_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "chest" TEXT,
    "waist" TEXT,
    "hips" TEXT,
    "height" TEXT,
    "inseam" TEXT,
    "materials" TEXT,
    "budget" TEXT,
    "timeline" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_orders_reference_key" ON "custom_orders"("reference");
