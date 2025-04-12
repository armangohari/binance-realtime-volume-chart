import { COMMON_BINANCE_PAIRS, TIMEFRAMES } from "@/constants/binancePairs";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // No caching

/**
 * GET /api/orderbook-data?pair=btcusdt&timeframe=5m
 *
 * This is a placeholder API route for orderbook data.
 * In the MVP, we're not storing historical orderbook data due to its high volume,
 * so this endpoint simply returns an informative message.
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

    // Return a placeholder response
    return NextResponse.json({
      pair: pair.toLowerCase(),
      timeframe,
      message:
        "Historical orderbook data is not available in this MVP version. The frontend uses live WebSocket connections for real-time orderbook data.",
      data: [], // Empty array as this is just a placeholder
    });
  } catch (error) {
    console.error("Error in orderbook-data API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch orderbook data" },
      { status: 500 },
    );
  }
}
