"use client";

import WebSocket from "ws";
import { BinanceDepthUpdate, processDepthData } from "./binanceUtils";
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

class BinanceDataCollector {
  private connections: Map<string, SocketConnection>;
  private dataBuffer: Map<string, Map<number, OrderbookEntry>>;
  private isCollecting: boolean;
  private flushInterval: NodeJS.Timeout | null;
  private readonly timeframe: string;
  private readonly timeframeMs: number;

  constructor(timeframe: string = DEFAULT_TIMEFRAME) {
    this.connections = new Map();
    this.dataBuffer = new Map();
    this.isCollecting = false;
    this.flushInterval = null;
    this.timeframe = timeframe;
    this.timeframeMs = TIMEFRAMES[timeframe as keyof typeof TIMEFRAMES] * 1000;

    // Initialize database
    initDatabase();

    // Initialize data buffers for each symbol
    SYMBOLS.forEach((symbol) => {
      this.dataBuffer.set(symbol, new Map());
    });
  }

  // Start collecting data for all symbols
  public startCollecting(): void {
    if (this.isCollecting) return;

    console.log(`Starting data collection for symbols: ${SYMBOLS.join(", ")}`);
    this.isCollecting = true;

    // Connect to WebSockets for all symbols
    SYMBOLS.forEach((symbol) => {
      this.connectWebSocket(symbol);
    });

    // Set up regular flushing of the data buffer to the database
    this.flushInterval = setInterval(() => {
      this.flushBufferToDB();
    }, 5000); // Flush every 5 seconds

    console.log("Data collection started successfully");
  }

  // Stop collecting data
  public stopCollecting(): void {
    if (!this.isCollecting) return;

    console.log("Stopping data collection...");
    this.isCollecting = false;

    // Close all WebSocket connections
    this.connections.forEach((connection, symbol) => {
      this.disconnectWebSocket(symbol);
    });

    // Clear the flush interval
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    console.log("Data collection stopped");
  }

  // Connect to WebSocket for a specific symbol
  private connectWebSocket(symbol: string): void {
    // If already connected, disconnect first
    if (this.connections.has(symbol)) {
      this.disconnectWebSocket(symbol);
    }

    // Create a new connection object
    const connection: SocketConnection = {
      symbol,
      ws: null,
      reconnectTimeout: null,
      reconnectCount: 0,
      status: "connecting",
    };

    this.connections.set(symbol, connection);

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
        this.logConnectionEvent(symbol, "connect");
      });

      ws.on("message", (data: WebSocket.Data) => {
        try {
          // Parse and process the incoming data
          const parsedData = JSON.parse(data.toString()) as BinanceDepthUpdate;
          this.processOrderbookData(symbol, parsedData);
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
        this.logConnectionEvent(
          symbol,
          "disconnect",
          `Code: ${code}, Reason: ${reason || "No reason provided"}`
        );

        // Attempt to reconnect if we're still collecting data
        if (this.isCollecting) {
          this.scheduleReconnect(symbol);
        }
      });

      ws.on("error", (error: Error) => {
        console.error(`WebSocket error for ${symbol}:`, error);
        connection.status = "error";
        connection.lastError = error.message;

        // Log error event
        this.logConnectionEvent(symbol, "error", error.message);

        // The close event will be emitted after the error
      });
    } catch (error) {
      console.error(`Error creating WebSocket for ${symbol}:`, error);
      connection.status = "error";
      connection.lastError =
        error instanceof Error ? error.message : String(error);

      // Log error event
      this.logConnectionEvent(symbol, "error", connection.lastError);

      // Schedule a reconnection
      if (this.isCollecting) {
        this.scheduleReconnect(symbol);
      }
    }
  }

  // Disconnect WebSocket for a specific symbol
  private disconnectWebSocket(symbol: string): void {
    const connection = this.connections.get(symbol);
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
    this.logConnectionEvent(symbol, "disconnect", "Manual disconnection");
  }

  // Schedule a reconnection attempt with exponential backoff
  private scheduleReconnect(symbol: string): void {
    const connection = this.connections.get(symbol);
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
    this.logConnectionEvent(
      symbol,
      "reconnect_attempt",
      `Attempt ${connection.reconnectCount}, backoff ${backoffTime}ms`
    );

    // Schedule the reconnection
    connection.reconnectTimeout = setTimeout(() => {
      if (this.isCollecting) {
        console.log(`Attempting to reconnect to ${symbol}...`);
        this.connectWebSocket(symbol);
      }
    }, backoffTime);
  }

  // Process orderbook data from WebSocket
  private processOrderbookData(symbol: string, data: BinanceDepthUpdate): void {
    // Process the depth data
    const { buyVolume, sellVolume } = processDepthData(data);

    // Get current timestamp and round it to the current timeframe
    const now = Date.now();
    const timeframeTimestamp =
      Math.floor(now / this.timeframeMs) * this.timeframeMs;

    // Get buffer for this symbol
    const symbolBuffer = this.dataBuffer.get(symbol);
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
        timeframe: this.timeframe,
        buy_volume: buyVolume,
        sell_volume: sellVolume,
        event_time: data.E,
      });
    }
  }

  // Flush the data buffer to the database
  private flushBufferToDB(): void {
    console.log("Flushing data buffer to database...");

    let totalFlushed = 0;

    // Process each symbol's buffer
    this.dataBuffer.forEach((symbolBuffer, symbol) => {
      // Skip if empty
      if (symbolBuffer.size === 0) return;

      // Get entries to flush
      const entries = Array.from(symbolBuffer.values());

      // Clear the buffer
      symbolBuffer.clear();

      // Save each entry to the database
      entries.forEach((entry) => {
        try {
          saveOrderbookData(entry);
          totalFlushed++;
        } catch (error) {
          console.error(`Error saving orderbook data for ${symbol}:`, error);
        }
      });
    });

    console.log(`Flushed ${totalFlushed} entries to database`);
  }

  // Log connection events to the database
  private logConnectionEvent(
    symbol: string,
    event: string,
    details?: string
  ): void {
    try {
      const logEntry: ConnectionLog = {
        timestamp: Date.now(),
        symbol,
        event,
        details,
      };

      logConnection(logEntry);
    } catch (error) {
      console.error(`Error logging connection event for ${symbol}:`, error);
    }
  }

  // Get status of all connections
  public getConnectionStatus(): Record<string, ConnectionStatusInfo> {
    const status: Record<string, ConnectionStatusInfo> = {};

    this.connections.forEach((connection, symbol) => {
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
}

// Export a singleton instance
let collectorInstance: BinanceDataCollector | null = null;

export function getDataCollector(timeframe?: string): BinanceDataCollector {
  if (!collectorInstance) {
    collectorInstance = new BinanceDataCollector(timeframe);
  }
  return collectorInstance;
}

export default BinanceDataCollector;
