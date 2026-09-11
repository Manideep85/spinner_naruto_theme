-- CreateTable
CREATE TABLE "CustomerRegistration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "token_code" TEXT NOT NULL,
    "prize_won" TEXT,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimed_at" TIMESTAMP(3),
    "whatsapp_link" TEXT,

    CONSTRAINT "CustomerRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenRecord" (
    "code" TEXT NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimed_at" TIMESTAMP(3),
    "prize_won_json" TEXT,
    "slice_index" INTEGER,
    "ip" TEXT,
    "user_agent" TEXT,
    "phone" TEXT,
    "customer_name" TEXT,
    "note" TEXT,

    CONSTRAINT "TokenRecord_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "PrizeRecord" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "character" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT NOT NULL,
    "textColor" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '',
    "badge" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrizeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpinLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "prize_won" TEXT,
    "ip" TEXT,
    "phone" TEXT,

    CONSTRAINT "SpinLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerRegistration_phone_key" ON "CustomerRegistration"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerRegistration_token_code_key" ON "CustomerRegistration"("token_code");

-- CreateIndex
CREATE INDEX "CustomerRegistration_phone_idx" ON "CustomerRegistration"("phone");

-- CreateIndex
CREATE INDEX "SpinLog_timestamp_idx" ON "SpinLog"("timestamp");

-- CreateIndex
CREATE INDEX "SpinLog_phone_idx" ON "SpinLog"("phone");

-- AddForeignKey
ALTER TABLE "CustomerRegistration" ADD CONSTRAINT "CustomerRegistration_token_code_fkey" FOREIGN KEY ("token_code") REFERENCES "TokenRecord"("code") ON DELETE CASCADE ON UPDATE CASCADE;
