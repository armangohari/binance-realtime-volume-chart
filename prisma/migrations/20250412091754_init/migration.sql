-- CreateTable
CREATE TABLE "RawTrade" (
    "id" BIGSERIAL NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL,
    "pair" VARCHAR(20) NOT NULL,
    "price" DECIMAL(18,8) NOT NULL,
    "quantity" DECIMAL(18,8) NOT NULL,
    "isBuyerMaker" BOOLEAN NOT NULL,

    CONSTRAINT "RawTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregatedTradeVolume" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL,
    "pair" VARCHAR(20) NOT NULL,
    "timeframe" VARCHAR(10) NOT NULL,
    "open" DECIMAL(18,8) NOT NULL,
    "high" DECIMAL(18,8) NOT NULL,
    "low" DECIMAL(18,8) NOT NULL,
    "close" DECIMAL(18,8) NOT NULL,
    "totalVolume" DECIMAL(18,8) NOT NULL,
    "buyVolume" DECIMAL(18,8) NOT NULL,
    "sellVolume" DECIMAL(18,8) NOT NULL,

    CONSTRAINT "AggregatedTradeVolume_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RawTrade_pair_timestamp_idx" ON "RawTrade"("pair", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "RawTrade_pair_key" ON "RawTrade"("pair");

-- CreateIndex
CREATE INDEX "AggregatedTradeVolume_pair_timeframe_timestamp_idx" ON "AggregatedTradeVolume"("pair", "timeframe", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "AggregatedTradeVolume_pair_timeframe_timestamp_key" ON "AggregatedTradeVolume"("pair", "timeframe", "timestamp");
