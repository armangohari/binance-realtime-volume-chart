"use client";

// Trade update interval (in microseconds)
const TRADE_UPDATE_SPEED = 100; // 100ms

// ----- INTERFACES -----

// Define the shape of Binance trade data
export interface BinanceTrade {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  t: number; // Trade ID
  p: string; // Price
  q: string; // Quantity
  b: number; // Buyer order ID
  a: number; // Seller order ID
  T: number; // Trade time
  m: boolean; // Is the buyer the market maker?
  M: boolean; // Ignore
}

// Volume data structure for trade charts
export interface TradeVolumeData {
  time: number;
  buyVolume: number;
  sellVolume: number;
}

// ----- DATA PROCESSING FUNCTIONS -----

// Get WebSocket URL for symbol's trade stream
export function getTradeStreamUrl(symbol: string): string {
  return `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`;
}

// Create a function to safely connect to WebSocket with fallback
export function createBinanceTradeWebSocket(
  symbol: string,
  onOpen: (event: Event) => void,
  onClose: (event: CloseEvent) => void,
  onError: (event: Event) => void,
  onMessage: (event: MessageEvent) => void,
): WebSocket {
  // Define an array of URLs to try in order
  const urls = [
    // Try main URL first
    getTradeStreamUrl(symbol),
    // Then try testnet
    `wss://testnet.binance.vision/ws/${symbol.toLowerCase()}@trade`,
    // Then try without port
    `wss://stream.binance.com/ws/${symbol.toLowerCase()}@trade`,
    // Finally try with fstream
    `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@trade`,
  ];

  // Log all URLs we're going to try
  console.log(
    "Attempting to connect to Trade WebSocket with following URLs:",
    urls,
  );

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

/**
 * Process trade data from Binance WebSocket
 * @param data The trade data from Binance
 * @returns Object containing calculated buy and sell volume
 */
export function processTradeData(data: BinanceTrade): {
  buyVolume: number;
  sellVolume: number;
} {
  const price = parseFloat(data.p);
  const quantity = parseFloat(data.q);
  const volume = price * quantity;

  // If m (isMaker) is false, it's a buy market order
  // If m (isMaker) is true, it's a sell market order
  const isBuy = !data.m;

  return {
    buyVolume: isBuy ? volume : 0,
    sellVolume: isBuy ? 0 : volume,
  };
}

// Aggregate data by timeframe
export function aggregateTradesByTimeframe(
  data: TradeVolumeData[],
  timeframeMs: number,
): TradeVolumeData[] {
  const aggregatedMap = new Map<number, TradeVolumeData>();

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

// ----- FORMATTING FUNCTIONS -----

/**
 * Format timestamp for display in HH:MM:SS format
 * @param timestamp
 * @returns Formatted time string
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Format volume as USD currency
 * @param volume
 * @returns Formatted volume string
 */
export function formatVolume(volume: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(volume);
}
