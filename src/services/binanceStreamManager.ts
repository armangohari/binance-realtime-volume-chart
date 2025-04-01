import WebSocket from "ws";
import { storeTradeData } from "./redisClient";

// List of target symbols and their update intervals
const SYMBOLS = [
  "btcusdt",
  "ethusdt",
  "solusdt",
  "xrpusdt",
  "dogeusdt",
  "adausdt",
];

// Interface for WebSocket connection status
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

// Interface for Binance trade data
interface BinanceTrade {
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

// Interface for connection status info
interface ConnectionStatus {
  connected: boolean;
  status: string;
  reconnectAttempts: number;
  lastConnected?: number;
  lastDisconnected?: number;
  lastError?: string;
}

export class BinanceStreamManager {
  private connections: Map<string, SocketConnection> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private isRunning: boolean = false;

  // Start streams for all symbols
  public startAllStreams(): void {
    this.isRunning = true;
    SYMBOLS.forEach((symbol) => this.startStream(symbol));
    console.log(`Started streams for ${SYMBOLS.length} symbols`);
  }

  // Start stream for a single symbol
  private startStream(symbol: string): void {
    // Don't reconnect if already connected
    if (this.connections.has(symbol) && this.connections.get(symbol)?.ws) {
      return;
    }

    // Create a new connection object
    const connection: SocketConnection = {
      symbol,
      ws: null,
      reconnectTimeout: null,
      reconnectCount: this.reconnectAttempts.get(symbol) || 0,
      status: "connecting",
    };

    this.connections.set(symbol, connection);

    // Using trade stream for more detailed volume data
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`;

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
        this.reconnectAttempts.set(symbol, 0);

        // Clear any reconnect timers
        if (this.reconnectTimers.has(symbol)) {
          clearTimeout(this.reconnectTimers.get(symbol)!);
          this.reconnectTimers.delete(symbol);
        }
      });

      ws.on("message", async (data: WebSocket.Data) => {
        try {
          // Parse the trade data
          const trade = JSON.parse(data.toString()) as BinanceTrade;

          // Extract fields
          const timestamp = trade.T; // Trade time
          const price = parseFloat(trade.p);
          const quantity = parseFloat(trade.q);
          const isBuyerMaker = trade.m; // true for sell, false for buy

          const volume = price * quantity;

          // Store in Redis
          await storeTradeData(
            symbol,
            timestamp,
            isBuyerMaker ? 0 : volume, // Buy volume
            isBuyerMaker ? volume : 0, // Sell volume
          );
        } catch (error) {
          console.error(`Error processing trade for ${symbol}:`, error);
        }
      });

      ws.on("close", () => {
        console.log(`WebSocket closed for ${symbol}`);
        connection.status = "disconnected";
        connection.lastDisconnected = Date.now();
        connection.ws = null;

        // Attempt to reconnect if still running
        if (this.isRunning) {
          this.scheduleReconnect(symbol);
        }
      });

      ws.on("error", (error) => {
        console.error(`WebSocket error for ${symbol}:`, error);
        connection.status = "error";
        connection.lastError = error.message;
        // Socket will close after error
      });
    } catch (error) {
      console.error(`Error creating WebSocket for ${symbol}:`, error);
      connection.status = "error";
      connection.lastError =
        error instanceof Error ? error.message : "Unknown error";

      // Attempt to reconnect
      if (this.isRunning) {
        this.scheduleReconnect(symbol);
      }
    }
  }

  // Schedule reconnection with exponential backoff
  private scheduleReconnect(symbol: string): void {
    // Don't schedule multiple reconnects for the same symbol
    if (this.reconnectTimers.has(symbol)) {
      return;
    }

    const reconnectDelay = this.calculateBackoff(symbol);
    console.log(`Scheduling reconnect for ${symbol} in ${reconnectDelay}ms`);

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(symbol);
      this.startStream(symbol);
    }, reconnectDelay);

    this.reconnectTimers.set(symbol, timer);
  }

  // Calculate backoff with exponential increase
  private calculateBackoff(symbol: string): number {
    const attempts = this.getReconnectAttempts(symbol);
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    const delay = Math.min(baseDelay * Math.pow(1.5, attempts), maxDelay);
    return delay;
  }

  // Track reconnection attempts
  private getReconnectAttempts(symbol: string): number {
    const attempts = (this.reconnectAttempts.get(symbol) || 0) + 1;
    this.reconnectAttempts.set(symbol, attempts);
    return attempts;
  }

  // Stop all streams
  public stopAllStreams(): void {
    this.isRunning = false;

    // Close all WebSocket connections
    this.connections.forEach((connection, symbol) => {
      if (connection.ws) {
        connection.ws.close();
        console.log(`Closed WebSocket for ${symbol}`);
        connection.ws = null;
      }
    });

    // Clear all reconnect timers
    this.reconnectTimers.forEach((timer) => clearTimeout(timer));
    this.reconnectTimers.clear();

    this.connections.clear();
    console.log("All streams stopped");
  }

  // Check if streams are running
  public isStreaming(): boolean {
    return this.isRunning;
  }

  // Get connection status for all symbols
  public getStatus(): {
    isRunning: boolean;
    connections: Record<string, ConnectionStatus>;
  } {
    const status: {
      isRunning: boolean;
      connections: Record<string, ConnectionStatus>;
    } = {
      isRunning: this.isRunning,
      connections: {},
    };

    SYMBOLS.forEach((symbol) => {
      const connection = this.connections.get(symbol);
      status.connections[symbol] = {
        connected: connection?.status === "connected",
        status: connection?.status || "not_initialized",
        reconnectAttempts: this.reconnectAttempts.get(symbol) || 0,
        lastConnected: connection?.lastConnected,
        lastDisconnected: connection?.lastDisconnected,
        lastError: connection?.lastError,
      };
    });

    return status;
  }
}

// Create and export singleton instance
const streamManager = new BinanceStreamManager();
export default streamManager;
