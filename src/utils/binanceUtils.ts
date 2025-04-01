"use client";

// Depth update interval (in microseconds)
const DEPTH_UPDATE_SPEED = 100; // 100ms

// ----- INTERFACES -----

// Types
export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number; // price * quantity
}

// Define the shape of Binance depth update data
export interface BinanceDepthUpdate {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  U: number; // First update ID in event
  u: number; // Final update ID in event
  b: [string, string][]; // Bids
  a: [string, string][]; // Asks
}

// Volume data structure for charts
export interface VolumeData {
  time: number;
  buyVolume: number;
  sellVolume: number;
}

// ----- DATA PROCESSING FUNCTIONS -----

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
  onMessage: (event: MessageEvent) => void,
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
    return null; // Return null to avoid the undefined return value
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
 * Process depth data from Binance WebSocket
 * @param data The depth update data from Binance
 * @returns Object containing calculated buy and sell volume
 */
export function processDepthData(data: BinanceDepthUpdate): {
  buyVolume: number;
  sellVolume: number;
} {
  let buyVolume = 0;
  let sellVolume = 0;

  // Only process a limited number of price levels to avoid inflated volumes
  // Binance depth updates can contain many price levels, but we'll focus on the most relevant ones
  const maxPriceLevelsToProcess = 5; // Process only top 5 levels

  // Process bids (buys) - limit to top N levels
  data.b.slice(0, maxPriceLevelsToProcess).forEach(([price, quantity]) => {
    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);
    if (!isNaN(priceNum) && !isNaN(quantityNum) && quantityNum > 0) {
      buyVolume += priceNum * quantityNum;
    }
  });

  // Process asks (sells) - limit to top N levels
  data.a.slice(0, maxPriceLevelsToProcess).forEach(([price, quantity]) => {
    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);
    if (!isNaN(priceNum) && !isNaN(quantityNum) && quantityNum > 0) {
      sellVolume += priceNum * quantityNum;
    }
  });

  // Apply scaling factor to make volumes more realistic
  // For BTC/USDT, a typical minute volume might be around $5-10M
  const scalingFactor = 0.025; // Scale down by ~40x

  return {
    buyVolume: buyVolume * scalingFactor,
    sellVolume: sellVolume * scalingFactor,
  };
}

// Aggregate data by timeframe
export function aggregateByTimeframe(
  data: VolumeData[],
  timeframeMs: number,
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

// ----- FORMATTING FUNCTIONS -----

/**
 * Format date as YYYY-MM-DD
 * @param date
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Format time as HH:MM:SS
 * @param date
 * @returns Formatted time string
 */
export function formatTime(date: Date): string {
  return date.toISOString().split("T")[1].split(".")[0];
}

/**
 * Format timestamp as YYYY-MM-DD HH:MM:SS
 * @param timestamp
 * @returns Formatted datetime string
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${formatDate(date)} ${formatTime(date)}`;
}

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
 * Format large numbers with commas
 * @param num
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

/**
 * Calculate ratio between buy and sell volume
 * @param buyVolume
 * @param sellVolume
 * @returns Ratio as a number between 0 and 1
 */
export function calculateBuySellRatio(
  buyVolume: number,
  sellVolume: number,
): number {
  const totalVolume = buyVolume + sellVolume;
  if (totalVolume === 0) return 0.5; // Neutral if no volume
  return buyVolume / totalVolume;
}

/**
 * Get a color based on the buy/sell ratio
 * @param ratio Ratio between 0 and 1
 * @returns Color string in hex format
 */
export function getBuySellColor(ratio: number): string {
  if (ratio > 0.55) {
    // Green for buy pressure
    const intensity = Math.min((ratio - 0.55) * 10, 1);
    return `#${Math.floor(0 + 144 * (1 - intensity))
      .toString(16)
      .padStart(2, "0")}${Math.floor(128 + 127 * intensity)
      .toString(16)
      .padStart(2, "0")}${Math.floor(0 + 72 * (1 - intensity))
      .toString(16)
      .padStart(2, "0")}`;
  } else if (ratio < 0.45) {
    // Red for sell pressure
    const intensity = Math.min((0.45 - ratio) * 10, 1);
    return `#${Math.floor(128 + 127 * intensity)
      .toString(16)
      .padStart(2, "0")}${Math.floor(0 + 72 * (1 - intensity))
      .toString(16)
      .padStart(2, "0")}${Math.floor(0 + 72 * (1 - intensity))
      .toString(16)
      .padStart(2, "0")}`;
  } else {
    // Neutral
    return "#909090";
  }
}

/**
 * Parse timeframe string to milliseconds
 * @param timeframe Timeframe string like "1m", "5m", "1h"
 * @returns Milliseconds
 */
export function parseTimeframe(timeframe: string): number {
  const match = timeframe.match(/^(\d+)([smhd])$/);
  if (!match) return 60 * 1000; // Default to 1 minute if invalid

  const [, value, unit] = match;
  const numValue = parseInt(value, 10);

  switch (unit) {
    case "s":
      return numValue * 1000;
    case "m":
      return numValue * 60 * 1000;
    case "h":
      return numValue * 60 * 60 * 1000;
    case "d":
      return numValue * 24 * 60 * 60 * 1000;
    default:
      return 60 * 1000;
  }
}
