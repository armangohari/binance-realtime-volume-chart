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

// Create a function to safely connect to WebSocket with fallback
export function createBinanceWebSocket(
  symbol: string,
  onOpen: (event: Event) => void,
  onClose: (event: CloseEvent) => void,
  onError: (event: Event) => void,
  onMessage: (event: MessageEvent) => void
): WebSocket {
  // Define an array of URLs to try in order
  const urls = [
    // Try testnet first if in development
    `wss://testnet.binance.vision/ws/${symbol.toLowerCase()}@depth@${DEPTH_UPDATE_SPEED}ms`,
    // Then try without port
    `wss://stream.binance.com/ws/${symbol.toLowerCase()}@depth@${DEPTH_UPDATE_SPEED}ms`,
    // Then try with port (original)
    getDepthStreamUrl(symbol),
    // Finally try with fstream
    `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@depth@${DEPTH_UPDATE_SPEED}ms`,
  ];

  // Log all URLs we're going to try
  console.log("Attempting to connect to WebSocket with following URLs:", urls);

  // Try the first URL
  const ws = new WebSocket(urls[0]);
  let currentUrlIndex = 0;

  // Setup handlers with improved logging
  ws.onopen = (event) => {
    console.log(`Successfully connected to ${urls[currentUrlIndex]}`);
    onOpen(event);
  };

  ws.onclose = (event) => {
    console.log(`WebSocket connection closed: ${event.code}`, event);

    // Try the next URL if this wasn't a normal closure and we have more URLs to try
    if (event.code !== 1000 && currentUrlIndex < urls.length - 1) {
      currentUrlIndex++;
      console.log(`Trying next URL: ${urls[currentUrlIndex]}`);
      const nextWs = new WebSocket(urls[currentUrlIndex]);

      // Transfer all event handlers
      nextWs.onopen = ws.onopen;
      nextWs.onclose = ws.onclose;
      nextWs.onerror = ws.onerror;
      nextWs.onmessage = ws.onmessage;

      // Return the new connection
      return nextWs;
    }

    onClose(event);
  };

  ws.onerror = (event) => {
    console.warn(`WebSocket error with ${urls[currentUrlIndex]}:`, event);
    onError(event);

    // The onclose handler will be called automatically after an error
  };

  ws.onmessage = onMessage;

  return ws;
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
