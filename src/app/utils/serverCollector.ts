"use server";

import { WebSocket } from "ws";
import { BinanceDepthUpdate } from "./binanceUtils";
import { processDepthData } from "./serverBinanceUtils";
import {
  initDatabase,
  saveOrderbookData,
  logConnection,
  ConnectionLog,
  OrderbookEntry,
} from "./dbService";

// List of target symbols and their update intervals
const SYMBOLS = [
  "btcusdt",
  "ethusdt",
  "solusdt",
  "xrpusdt",
  "dogeusdt",
  "adausdt",
];
const DEPTH_UPDATE_SPEED = 100; // 100ms

// Available timeframes in seconds
const TIMEFRAMES = {
  "1s": 1,
  "5s": 5,
  "15s": 15,
  "30s": 30,
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
};

// Default timeframe to collect data
const DEFAULT_TIMEFRAME = "1s";

// Interface for socket manager
interface SocketConnection {
  symbol: string;
  ws: WebSocket | null;
  reconnectTimeout: NodeJS.Timeout | null;
  reconnectCount: number;
  status: "connecting" | "connected" | "disconnected" | "error";
  lastError?: string;
  lastConnected?: number;
  lastDisconnected?: number;
}

interface ConnectionStatusInfo {
  status: string;
  reconnectCount: number;
  lastConnected?: number;
  lastDisconnected?: number;
  lastError?: string;
}

// Maps to store active connections and buffers
const connections = new Map<string, SocketConnection>();
const dataBuffer = new Map<string, Map<number, OrderbookEntry>>();
let isCollecting = false;
let flushInterval: NodeJS.Timeout | null = null;
let currentTimeframe = DEFAULT_TIMEFRAME;
let timeframeMs =
  TIMEFRAMES[currentTimeframe as keyof typeof TIMEFRAMES] * 1000;

// Initialize database
(async () => {
  try {
    await initDatabase();
  } catch (error) {
    console.error("Error initializing database:", error);
  }
})();

// Initialize data buffers for each symbol
SYMBOLS.forEach((symbol) => {
  dataBuffer.set(symbol, new Map());
});

// Start collecting data for all symbols
export async function startDataCollection(
  timeframe: string = DEFAULT_TIMEFRAME
): Promise<void> {
  if (isCollecting) return;

  console.log(`Starting data collection for symbols: ${SYMBOLS.join(", ")}`);
  isCollecting = true;

  // Set timeframe
  currentTimeframe = timeframe;
  timeframeMs = TIMEFRAMES[timeframe as keyof typeof TIMEFRAMES] * 1000;

  // Connect to WebSockets for all symbols
  SYMBOLS.forEach((symbol) => {
    connectWebSocket(symbol);
  });

  // Set up regular flushing of the data buffer to the database
  flushInterval = setInterval(() => {
    flushBufferToDB();
  }, 5000); // Flush every 5 seconds

  console.log("Data collection started successfully");
}

// Stop collecting data
export async function stopDataCollection(): Promise<void> {
  if (!isCollecting) return;

  console.log("Stopping data collection...");
  isCollecting = false;

  // Close all WebSocket connections
  connections.forEach((connection, symbol) => {
    disconnectWebSocket(symbol);
  });

  // Clear the flush interval
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }

  console.log("Data collection stopped");
}

// Connect to WebSocket for a specific symbol
function connectWebSocket(symbol: string): void {
  // If already connected, disconnect first
  if (connections.has(symbol)) {
    disconnectWebSocket(symbol);
  }

  // Create a new connection object
  const connection: SocketConnection = {
    symbol,
    ws: null,
    reconnectTimeout: null,
    reconnectCount: 0,
    status: "connecting",
  };

  connections.set(symbol, connection);

  const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth@${DEPTH_UPDATE_SPEED}ms`;

  try {
    console.log(`Connecting to ${wsUrl}...`);

    // Create WebSocket connection
    const ws = new WebSocket(wsUrl);
    connection.ws = ws;

    // Set up event handlers
    ws.on("open", () => {
      console.log(`Connected to Binance WebSocket for ${symbol}`);
      connection.status = "connected";
      connection.lastConnected = Date.now();
      connection.reconnectCount = 0;

      // Log connection event
      logConnectionEvent(symbol, "connect").catch((err) => {
        console.error(`Error logging connect event for ${symbol}:`, err);
      });
    });

    ws.on("message", (data: WebSocket.Data) => {
      try {
        // Parse and process the incoming data
        const parsedData = JSON.parse(data.toString()) as BinanceDepthUpdate;
        // Call the async function but don't await it to avoid blocking
        processOrderbookData(symbol, parsedData).catch((err) => {
          console.error(`Error in processOrderbookData for ${symbol}:`, err);
        });
      } catch (error) {
        console.error(
          `Error processing WebSocket message for ${symbol}:`,
          error
        );
      }
    });

    ws.on("close", (code: number, reason: string) => {
      console.log(`WebSocket for ${symbol} closed: ${code} - ${reason}`);
      connection.status = "disconnected";
      connection.lastDisconnected = Date.now();
      connection.ws = null;

      // Log disconnection event
      logConnectionEvent(
        symbol,
        "disconnect",
        `Code: ${code}, Reason: ${reason || "No reason provided"}`
      ).catch((err) => {
        console.error(`Error logging disconnect event for ${symbol}:`, err);
      });

      // Attempt to reconnect if we're still collecting data
      if (isCollecting) {
        scheduleReconnect(symbol);
      }
    });

    ws.on("error", (error: Error) => {
      console.error(`WebSocket error for ${symbol}:`, error);
      connection.status = "error";
      connection.lastError = error.message;

      // Log error event
      logConnectionEvent(symbol, "error", error.message).catch((err) => {
        console.error(`Error logging error event for ${symbol}:`, err);
      });

      // The close event will be emitted after the error
    });
  } catch (error) {
    console.error(`Error creating WebSocket for ${symbol}:`, error);
    connection.status = "error";
    connection.lastError =
      error instanceof Error ? error.message : String(error);

    // Log error event
    logConnectionEvent(symbol, "error", connection.lastError).catch((err) => {
      console.error(`Error logging error event for ${symbol}:`, err);
    });

    // Schedule a reconnection
    if (isCollecting) {
      scheduleReconnect(symbol);
    }
  }
}

// Disconnect WebSocket for a specific symbol
function disconnectWebSocket(symbol: string): void {
  const connection = connections.get(symbol);
  if (!connection) return;

  // Clear any pending reconnect timeout
  if (connection.reconnectTimeout) {
    clearTimeout(connection.reconnectTimeout);
    connection.reconnectTimeout = null;
  }

  // Close the WebSocket if it exists
  if (connection.ws) {
    try {
      connection.ws.terminate();
    } catch (error) {
      console.error(`Error terminating WebSocket for ${symbol}:`, error);
    }
    connection.ws = null;
  }

  connection.status = "disconnected";
  connection.lastDisconnected = Date.now();

  // Log disconnection event
  logConnectionEvent(symbol, "disconnect", "Manual disconnection").catch(
    (err) => {
      console.error(`Error logging manual disconnect for ${symbol}:`, err);
    }
  );
}

// Schedule a reconnection attempt with exponential backoff
function scheduleReconnect(symbol: string): void {
  const connection = connections.get(symbol);
  if (!connection) return;

  // Clear any existing reconnect timeout
  if (connection.reconnectTimeout) {
    clearTimeout(connection.reconnectTimeout);
  }

  // Increase reconnect count
  connection.reconnectCount++;

  // Calculate backoff time with exponential backoff, but cap at 30 seconds
  const backoffTime = Math.min(
    Math.pow(2, connection.reconnectCount) * 1000,
    30000
  );

  console.log(
    `Scheduling reconnect for ${symbol} in ${backoffTime}ms (attempt ${connection.reconnectCount})`
  );

  // Log reconnect attempt
  logConnectionEvent(
    symbol,
    "reconnect_attempt",
    `Attempt ${connection.reconnectCount}, backoff ${backoffTime}ms`
  ).catch((err) => {
    console.error(`Error logging reconnect attempt for ${symbol}:`, err);
  });

  // Schedule the reconnection
  connection.reconnectTimeout = setTimeout(() => {
    if (isCollecting) {
      console.log(`Attempting to reconnect to ${symbol}...`);
      connectWebSocket(symbol);
    }
  }, backoffTime);
}

// Process orderbook data from WebSocket
async function processOrderbookData(
  symbol: string,
  data: BinanceDepthUpdate
): Promise<void> {
  try {
    // Process the depth data
    const { buyVolume, sellVolume } = await processDepthData(data);

    // Get current timestamp and round it to the current timeframe
    const now = Date.now();
    const timeframeTimestamp = Math.floor(now / timeframeMs) * timeframeMs;

    // Get buffer for this symbol
    const symbolBuffer = dataBuffer.get(symbol);
    if (!symbolBuffer) return;

    // If we have data for this timeframe already, update it
    if (symbolBuffer.has(timeframeTimestamp)) {
      const existing = symbolBuffer.get(timeframeTimestamp)!;
      symbolBuffer.set(timeframeTimestamp, {
        ...existing,
        buy_volume: existing.buy_volume + buyVolume,
        sell_volume: existing.sell_volume + sellVolume,
        event_time: data.E, // Update to the latest event time
      });
    } else {
      // Otherwise create a new entry
      symbolBuffer.set(timeframeTimestamp, {
        symbol,
        timestamp: timeframeTimestamp,
        timeframe: currentTimeframe,
        buy_volume: buyVolume,
        sell_volume: sellVolume,
        event_time: data.E,
      });
    }
  } catch (error) {
    console.error(`Error processing orderbook data for ${symbol}:`, error);
  }
}

// Flush the data buffer to the database
function flushBufferToDB(): void {
  console.log("Flushing data buffer to database...");

  let totalFlushed = 0;

  // Process each symbol's buffer
  dataBuffer.forEach(async (symbolBuffer, symbol) => {
    // Skip if empty
    if (symbolBuffer.size === 0) return;

    // Get entries to flush
    const entries = Array.from(symbolBuffer.values());

    // Clear the buffer
    symbolBuffer.clear();

    // Save each entry to the database
    for (const entry of entries) {
      try {
        await saveOrderbookData(entry);
        totalFlushed++;
      } catch (error) {
        console.error(`Error saving orderbook data for ${symbol}:`, error);
      }
    }
  });

  console.log(`Flushed ${totalFlushed} entries to database`);
}

// Log connection events to the database
async function logConnectionEvent(
  symbol: string,
  event: string,
  details?: string
): Promise<void> {
  try {
    const logEntry: ConnectionLog = {
      timestamp: Date.now(),
      symbol,
      event,
      details,
    };

    await logConnection(logEntry);
  } catch (error) {
    console.error(`Error logging connection event for ${symbol}:`, error);
  }
}

// Get status of all connections
export async function getCollectorStatus(): Promise<
  Record<string, ConnectionStatusInfo>
> {
  const status: Record<string, ConnectionStatusInfo> = {};

  connections.forEach((connection, symbol) => {
    status[symbol] = {
      status: connection.status,
      reconnectCount: connection.reconnectCount,
      lastConnected: connection.lastConnected,
      lastDisconnected: connection.lastDisconnected,
      lastError: connection.lastError,
    };
  });

  return status;
}
