"use server";

import { TIMEFRAMES } from "@/constants/binancePairs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface CandleData {
  time: number; // Timestamp in milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  totalVolume: number;
  buyVolume: number;
  sellVolume: number;
}

/**
 * Get the milliseconds value for a timeframe
 */
export async function getTimeframeInMs(timeframe: string): Promise<number> {
  return TIMEFRAMES[timeframe as keyof typeof TIMEFRAMES] * 1000;
}

/**
 * Aligns a timestamp to the start of a trading view candle for the given timeframe
 * @param timestamp Timestamp in milliseconds
 * @param timeframe Timeframe like "1m", "5m", etc.
 * @returns Aligned timestamp in milliseconds
 */
export async function alignTimestampToCandle(
  timestamp: number,
  timeframe: string,
): Promise<number> {
  const intervalSeconds = TIMEFRAMES[timeframe as keyof typeof TIMEFRAMES];
  if (!intervalSeconds) {
    throw new Error(`Invalid timeframe: ${timeframe}`);
  }

  const intervalMillis = intervalSeconds * 1000;
  return Math.floor(timestamp / intervalMillis) * intervalMillis;
}

/**
 * Fetches raw trade data from the database and aggregates it into candles
 * Uses Prisma's groupBy and aggregation functions where possible
 */
export async function getAggregatedTradeCandles(
  pair: string,
  timeframe: string,
): Promise<CandleData[]> {
  const timeframeMs = await getTimeframeInMs(timeframe);

  // Get all raw trades for the pair ordered by timestamp
  const rawTrades = await prisma.rawTrade.findMany({
    where: {
      pair: pair.toLowerCase(),
    },
    orderBy: {
      timestamp: "asc",
    },
    select: {
      timestamp: true,
      price: true,
      quantity: true,
      isBuyerMaker: true,
    },
  });

  if (rawTrades.length === 0) {
    return [];
  }

  // Group trades into timeframe buckets (manual aggregation)
  const candleMap = new Map<
    number,
    {
      trades: {
        timestamp: Date;
        price: Prisma.Decimal;
        quantity: Prisma.Decimal;
        isBuyerMaker: boolean;
      }[];
    }
  >();

  // Group trades by their timeframe-aligned timestamp
  for (const trade of rawTrades) {
    const tradeTimestamp = trade.timestamp.getTime();
    const alignedTimestamp = await alignTimestampToCandle(
      tradeTimestamp,
      timeframe,
    );

    if (!candleMap.has(alignedTimestamp)) {
      candleMap.set(alignedTimestamp, { trades: [] });
    }

    candleMap.get(alignedTimestamp)!.trades.push(trade);
  }

  // Calculate OHLC and volumes for each candle
  const candles: CandleData[] = [];

  for (const [timestamp, data] of candleMap.entries()) {
    const { trades } = data;

    // No trades in this timeframe
    if (trades.length === 0) continue;

    // Get first trade for 'open'
    const firstTrade = trades[0];
    // Get last trade for 'close'
    const lastTrade = trades[trades.length - 1];

    // Calculate high and low
    let high = firstTrade.price.toNumber();
    let low = firstTrade.price.toNumber();
    let totalVolume = 0;
    let buyVolume = 0;
    let sellVolume = 0;

    // Process all trades in the candle
    for (const trade of trades) {
      const price = trade.price.toNumber();
      const quantity = trade.quantity.toNumber();
      const volume = price * quantity;

      // Update high and low
      high = Math.max(high, price);
      low = Math.min(low, price);

      // Update volumes
      totalVolume += volume;

      if (trade.isBuyerMaker) {
        // isBuyerMaker = true means it was a sell order hitting a bid
        sellVolume += volume;
      } else {
        // isBuyerMaker = false means it was a buy order hitting an ask
        buyVolume += volume;
      }
    }

    candles.push({
      time: timestamp,
      open: firstTrade.price.toNumber(),
      high,
      low,
      close: lastTrade.price.toNumber(),
      totalVolume,
      buyVolume,
      sellVolume,
    });
  }

  // Sort candles by time
  return candles.sort((a, b) => a.time - b.time);
}

/**
 * A simpler version that just aggregates trade volume data without OHLC
 */
export async function getAggregatedTradeVolume(
  pair: string,
  timeframe: string,
): Promise<
  {
    time: number;
    buyVolume: number;
    sellVolume: number;
  }[]
> {
  const timeframeMs = await getTimeframeInMs(timeframe);

  // Get all raw trades for the pair
  const rawTrades = await prisma.rawTrade.findMany({
    where: {
      pair: pair.toLowerCase(),
    },
    select: {
      timestamp: true,
      price: true,
      quantity: true,
      isBuyerMaker: true,
    },
  });

  if (rawTrades.length === 0) {
    return [];
  }

  // Group trades into timeframe buckets
  const volumeMap = new Map<
    number,
    {
      buyVolume: number;
      sellVolume: number;
    }
  >();

  // Process each trade
  for (const trade of rawTrades) {
    const tradeTimestamp = trade.timestamp.getTime();
    const alignedTimestamp = await alignTimestampToCandle(
      tradeTimestamp,
      timeframe,
    );
    const price = trade.price.toNumber();
    const quantity = trade.quantity.toNumber();
    const volume = price * quantity;

    if (!volumeMap.has(alignedTimestamp)) {
      volumeMap.set(alignedTimestamp, {
        buyVolume: 0,
        sellVolume: 0,
      });
    }

    const entry = volumeMap.get(alignedTimestamp)!;

    if (trade.isBuyerMaker) {
      // Sell order hitting a bid
      entry.sellVolume += volume;
    } else {
      // Buy order hitting an ask
      entry.buyVolume += volume;
    }
  }

  // Convert to array and sort
  return Array.from(volumeMap.entries())
    .map(([time, { buyVolume, sellVolume }]) => ({
      time,
      buyVolume,
      sellVolume,
    }))
    .sort((a, b) => a.time - b.time);
}

/**
 * Aggregates raw trade data into volume candles for a specific timeframe
 * @param trades Array of raw trades
 * @param timeframe Timeframe like "1m", "5m", etc.
 * @returns Aggregated volume data
 */
export async function aggregateTradesByTimeframe(
  trades: any[], // Adjust type according to your trade data structure
  timeframe: string,
) {
  if (!trades.length) return [];

  const candles = new Map();
  const intervalSeconds = TIMEFRAMES[timeframe as keyof typeof TIMEFRAMES];
  const intervalMillis = intervalSeconds * 1000;

  // Process each trade
  for (const trade of trades) {
    const timestamp =
      typeof trade.timestamp === "number"
        ? trade.timestamp
        : new Date(trade.timestamp).getTime();

    // Align to the current timeframe bucket
    const alignedTime = await alignTimestampToCandle(timestamp, timeframe);

    // Initialize or update candle
    if (!candles.has(alignedTime)) {
      candles.set(alignedTime, {
        time: alignedTime,
        buyVolume: 0,
        sellVolume: 0,
        open: trade.price,
        high: trade.price,
        low: trade.price,
        close: trade.price,
      });
    }

    const candle = candles.get(alignedTime);

    // Update volumes
    if (trade.isBuyerMaker) {
      candle.sellVolume += Number(trade.quantity);
    } else {
      candle.buyVolume += Number(trade.quantity);
    }

    // Update OHLC data
    const price = Number(trade.price);
    candle.high = Math.max(candle.high, price);
    candle.low = Math.min(candle.low, price);
    candle.close = price; // Last trade price becomes close
  }

  // Convert Map to sorted array
  return Array.from(candles.values()).sort((a, b) => a.time - b.time);
}
