import { createClient } from "redis";

// Create Redis client with local connection
export const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

// Initialize connection
(async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Redis connection error:", error);
  }
})();

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await redisClient.disconnect();
  process.exit(0);
});

// Store trade data in Redis
export async function storeTradeData(
  symbol: string,
  timestamp: number,
  buyVolume: number,
  sellVolume: number,
) {
  try {
    const now = Date.now();

    // Store data with timestamp
    await redisClient.hSet(`trade:${symbol}:${timestamp}`, {
      timestamp,
      buyVolume: buyVolume.toString(),
      sellVolume: sellVolume.toString(),
      recorded: now.toString(),
    });

    // Set expiration (24 hours)
    await redisClient.expire(`trade:${symbol}:${timestamp}`, 86400);

    // Add to sorted set for time-based retrieval
    await redisClient.zAdd(`trades:${symbol}`, {
      score: timestamp,
      value: timestamp.toString(),
    });

    // Keep sorted set trimmed to last 24 hours
    const cutoff = now - 86400000;
    await redisClient.zRemRangeByScore(`trades:${symbol}`, 0, cutoff);

    return true;
  } catch (error) {
    console.error(`Error storing trade data for ${symbol}:`, error);
    return false;
  }
}

// Helper function to convert timeframe to milliseconds
export function convertTimeframeToMs(timeframe: string): number {
  const timeframes: Record<string, number> = {
    "1s": 1000,
    "5s": 5000,
    "15s": 15000,
    "30s": 30000,
    "1m": 60000,
    "5m": 300000,
    "15m": 900000,
    "30m": 1800000,
    "1h": 3600000,
  };

  return timeframes[timeframe] || 1000;
}

// Get aggregated data for specific timeframe
export async function getAggregatedData(
  symbol: string,
  timeframe: string,
  startTime: number,
  endTime: number,
) {
  try {
    // Get all trade timestamps in the time range
    const tradeTimestamps = await redisClient.zRangeByScore(
      `trades:${symbol}`,
      startTime,
      endTime,
    );

    if (!tradeTimestamps || tradeTimestamps.length === 0) {
      return [];
    }

    // Fetch trade data for each timestamp
    const tradeData = [];
    for (const timestampStr of tradeTimestamps) {
      const timestamp = parseInt(timestampStr);
      const data = await redisClient.hGetAll(`trade:${symbol}:${timestamp}`);

      if (data && data.timestamp) {
        tradeData.push({
          timestamp: parseInt(data.timestamp),
          buyVolume: parseFloat(data.buyVolume || "0"),
          sellVolume: parseFloat(data.sellVolume || "0"),
        });
      }
    }

    // Aggregate data based on timeframe
    const timeframeMs = convertTimeframeToMs(timeframe);
    const aggregatedData = aggregateTradeData(tradeData, timeframeMs);

    return aggregatedData;
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return [];
  }
}

// Aggregate raw trade data into specified timeframe buckets
interface TradeData {
  timestamp: number;
  buyVolume: number;
  sellVolume: number;
}

function aggregateTradeData(tradeData: TradeData[], timeframeMs: number) {
  if (!tradeData || tradeData.length === 0) return [];

  // Sort data by timestamp
  const sortedData = [...tradeData].sort((a, b) => a.timestamp - b.timestamp);

  // Create timeframe buckets
  const buckets = new Map<
    number,
    {
      timestamp: number;
      buyVolume: number;
      sellVolume: number;
    }
  >();

  // Process each data point
  sortedData.forEach((data) => {
    // Calculate bucket timestamp (floor to timeframe)
    const bucketTimestamp =
      Math.floor(data.timestamp / timeframeMs) * timeframeMs;

    // Get or create bucket
    if (!buckets.has(bucketTimestamp)) {
      buckets.set(bucketTimestamp, {
        timestamp: bucketTimestamp,
        buyVolume: 0,
        sellVolume: 0,
      });
    }

    // Add data to bucket
    const bucket = buckets.get(bucketTimestamp)!;
    bucket.buyVolume += data.buyVolume;
    bucket.sellVolume += data.sellVolume;
  });

  // Convert map to array and sort by timestamp
  return Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp);
}
