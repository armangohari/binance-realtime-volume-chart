import { NextRequest, NextResponse } from "next/server";

// This endpoint will fetch Binance orderbook data and return it
// Note: This is an alternative implementation to the client-side WebSocket
// You can use this if you prefer to handle WebSocket connections on the server side

export async function GET(request: NextRequest) {
  try {
    // Get symbol from query parameters or default to btcusdt
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get("symbol")?.toLowerCase() || "btcusdt";

    // Fetch the orderbook snapshot from Binance REST API
    const response = await fetch(
      `https://api.binance.com/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=100`
    );

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();

    // Process orderbook data
    let buyVolume = 0;
    let sellVolume = 0;

    // Process bids (buy orders)
    if (data.bids && Array.isArray(data.bids)) {
      data.bids.forEach((bid: [string, string]) => {
        const price = parseFloat(bid[0]);
        const quantity = parseFloat(bid[1]);
        if (quantity > 0) {
          buyVolume += price * quantity;
        }
      });
    }

    // Process asks (sell orders)
    if (data.asks && Array.isArray(data.asks)) {
      data.asks.forEach((ask: [string, string]) => {
        const price = parseFloat(ask[0]);
        const quantity = parseFloat(ask[1]);
        if (quantity > 0) {
          sellVolume += price * quantity;
        }
      });
    }

    // Return the processed data
    return NextResponse.json({
      symbol,
      timestamp: Date.now(),
      buyVolume,
      sellVolume,
      raw: data,
    });
  } catch (error) {
    console.error("Error fetching Binance data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Binance" },
      { status: 500 }
    );
  }
}
