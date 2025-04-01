import { NextRequest, NextResponse } from "next/server";
import { getOrderbookData, getAvailableSymbols } from "../../utils/dbService";

// API route to get orderbook data for a specific symbol and time range
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);

    // Check if we need to return available symbols
    if (searchParams.get("action") === "symbols") {
      const symbols = await getAvailableSymbols();
      return NextResponse.json({ symbols });
    }

    // Get parameters
    const symbol = searchParams.get("symbol")?.toLowerCase();
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const timeframe = searchParams.get("timeframe");

    // Validate required parameters
    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          message: "Symbol parameter is required",
        },
        { status: 400 }
      );
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          message: "Start time and end time parameters are required",
        },
        { status: 400 }
      );
    }

    // Parse parameters
    const startTimeMs = parseInt(startTime);
    const endTimeMs = parseInt(endTime);

    if (isNaN(startTimeMs) || isNaN(endTimeMs)) {
      return NextResponse.json(
        {
          success: false,
          message: "Start time and end time must be valid integers",
        },
        { status: 400 }
      );
    }

    // Get orderbook data
    const data = await getOrderbookData(
      symbol,
      startTimeMs,
      endTimeMs,
      timeframe || undefined
    );

    // Transform data format to match what the chart expects
    const formattedData = data.map((entry) => ({
      time: entry.timestamp,
      buyVolume: entry.buy_volume,
      sellVolume: entry.sell_volume,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      timeframe: timeframe || data[0]?.timeframe || "1s",
      symbol,
      startTime: startTimeMs,
      endTime: endTimeMs,
      count: formattedData.length,
    });
  } catch (error) {
    console.error("Error fetching orderbook data:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
