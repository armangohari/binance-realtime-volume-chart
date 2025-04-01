import { NextRequest, NextResponse } from "next/server";
import { getAggregatedData } from "../../../../../services/redisClient";

// Removing TypeScript type for context parameter
export async function GET(request: NextRequest, context: any) {
  try {
    const { symbol, timeframe } = context.params;
    const { searchParams } = new URL(request.url);

    // Get time range from query parameters or use defaults
    const start = parseInt(
      searchParams.get("start") || (Date.now() - 3600000).toString(),
    ); // 1 hour ago
    const end = parseInt(searchParams.get("end") || Date.now().toString());

    // Validate symbol
    if (!symbol) {
      return NextResponse.json(
        { success: false, message: "Symbol is required" },
        { status: 400 },
      );
    }

    // Validate timeframe
    const validTimeframes = [
      "1s",
      "5s",
      "15s",
      "30s",
      "1m",
      "5m",
      "15m",
      "30m",
      "1h",
    ];
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid timeframe. Valid values are: ${validTimeframes.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Get data from Redis
    const data = await getAggregatedData(
      symbol.toLowerCase(),
      timeframe,
      start,
      end,
    );

    return NextResponse.json({
      success: true,
      symbol: symbol.toLowerCase(),
      timeframe,
      start,
      end,
      data,
    });
  } catch (error) {
    console.error("Error fetching volume data:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
