"use client";

// Depth update interval (in microseconds)
const DEPTH_UPDATE_SPEED = 100; // 100ms

// Types
export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number; // price * quantity
}

export interface VolumeData {
  time: number;
  buyVolume: number;
  sellVolume: number;
}

// Define the shape of Binance depth update data
export interface BinanceDepthUpdate {
  e?: string; // Event type
  E?: number; // Event time
  s?: string; // Symbol
  U?: number; // First update ID in event
  u?: number; // Final update ID in event
  b: [string, string][]; // Bids to be updated [price, quantity]
  a: [string, string][]; // Asks to be updated [price, quantity]
}

// Get WebSocket URL for symbol's depth stream
export function getDepthStreamUrl(symbol: string): string {
  return `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth@${DEPTH_UPDATE_SPEED}ms`;
}

// Process raw depth data from WebSocket
export function processDepthData(data: BinanceDepthUpdate): {
  buyVolume: number;
  sellVolume: number;
} {
  let buyVolume = 0;
  let sellVolume = 0;

  // Process bids (buy orders)
  if (data.b && Array.isArray(data.b)) {
    data.b.forEach((bid: [string, string]) => {
      const price = parseFloat(bid[0]);
      const quantity = parseFloat(bid[1]);
      if (quantity > 0) {
        buyVolume += price * quantity;
      }
    });
  }

  // Process asks (sell orders)
  if (data.a && Array.isArray(data.a)) {
    data.a.forEach((ask: [string, string]) => {
      const price = parseFloat(ask[0]);
      const quantity = parseFloat(ask[1]);
      if (quantity > 0) {
        sellVolume += price * quantity;
      }
    });
  }

  return { buyVolume, sellVolume };
}

// Aggregate data by timeframe
export function aggregateByTimeframe(
  data: VolumeData[],
  timeframeMs: number
): VolumeData[] {
  const aggregatedMap = new Map<number, VolumeData>();

  // Process each data point
  data.forEach((item) => {
    // Round timestamp to the nearest timeframe boundary
    const timeframeBoundary = Math.floor(item.time / timeframeMs) * timeframeMs;

    // If we already have data for this timeframe, update it
    if (aggregatedMap.has(timeframeBoundary)) {
      const existing = aggregatedMap.get(timeframeBoundary)!;
      aggregatedMap.set(timeframeBoundary, {
        time: timeframeBoundary,
        buyVolume: existing.buyVolume + item.buyVolume,
        sellVolume: existing.sellVolume + item.sellVolume,
      });
    } else {
      // Otherwise create a new entry
      aggregatedMap.set(timeframeBoundary, {
        time: timeframeBoundary,
        buyVolume: item.buyVolume,
        sellVolume: item.sellVolume,
      });
    }
  });

  // Convert map to array and sort by time
  return Array.from(aggregatedMap.values()).sort((a, b) => a.time - b.time);
}

// Format timestamp for display
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// Format volume number for display
export function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(2)}M`;
  } else if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(2)}K`;
  } else {
    return `$${volume.toFixed(2)}`;
  }
}
