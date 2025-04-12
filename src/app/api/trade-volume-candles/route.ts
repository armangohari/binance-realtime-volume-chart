import { NextRequest, NextResponse } from "next/server";
import { getAggregatedTradeCandles } from "@/utils/tradeAggregationUtils";
import { COMMON_BINANCE_PAIRS, TIMEFRAMES } from "@/constants/binancePairs";

export const dynamic = "force-dynamic"; // No caching

/**
 * GET /api/trade-volume-candles?pair=btcusdt&timeframe=5m
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const pair = searchParams.get("pair");
    const timeframe = searchParams.get("timeframe");

    // Validate parameters
    if (!pair) {
      return NextResponse.json(
        { error: "Missing required 'pair' parameter" },
        { status: 400 },
      );
    }

    if (!COMMON_BINANCE_PAIRS.includes(pair.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Invalid pair: '${pair}'. Supported pairs: ${COMMON_BINANCE_PAIRS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (!timeframe) {
      return NextResponse.json(
        { error: "Missing required 'timeframe' parameter" },
        { status: 400 },
      );
    }

    if (!Object.keys(TIMEFRAMES).includes(timeframe)) {
      return NextResponse.json(
        {
          error: `Invalid timeframe: '${timeframe}'. Supported timeframes: ${Object.keys(TIMEFRAMES).join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Fetch and aggregate data
    const candles = await getAggregatedTradeCandles(pair, timeframe);

    // Return data
    return NextResponse.json({
      pair: pair.toLowerCase(),
      timeframe,
      candles,
    });
  } catch (error) {
    console.error("Error in trade-volume-candles API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch trade volume candles" },
      { status: 500 },
    );
  }
}
