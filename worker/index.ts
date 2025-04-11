import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import dotenv from "dotenv";
import WebSocket from "ws";

// Initialize environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ["error", "warn"],
});

// Configure batch size and flush interval from env vars
const DB_BATCH_SIZE = parseInt(process.env.DB_BATCH_SIZE!, 10);
const DB_FLUSH_INTERVAL = parseInt(process.env.DB_FLUSH_INTERVAL!, 10);
const SYMBOLS = process.env.SYMBOLS!.split(",");

// Define trade data interface matching Binance schema
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

// Batch processing arrays
let tradeBatch: {
  timestamp: Date;
  pair: string;
  price: Decimal;
  quantity: Decimal;
  isBuyerMaker: boolean;
}[] = [];

// Function to flush batched trades to database
async function flushTradesToDatabase() {
  if (tradeBatch.length === 0) {
    return;
  }

  try {
    const batchToProcess = [...tradeBatch];
    tradeBatch = []; // Clear batch for more items

    console.log(`Inserting ${batchToProcess.length} trades to database...`);

    // Use createMany for efficient batch insert
    await prisma.rawTrade.createMany({
      data: batchToProcess,
    });

    console.log(`Successfully inserted ${batchToProcess.length} trades`);
  } catch (error) {
    console.error("Error flushing trades to database:", error);
    // Re-add failed items to batch (optional, depending on error handling strategy)
    // tradeBatch = [...failedItems, ...tradeBatch];
  }
}

// Function to get the WebSocket URL for a specific symbol
function getTradeStreamUrl(symbol: string): string {
  return `${process.env.BINANCE_WS_URL}/${symbol.toLowerCase()}@trade`;
}

// Function to create a WebSocket connection for a specific symbol
function createTradeWebSocket(symbol: string) {
  const url = getTradeStreamUrl(symbol);
  console.log(`Connecting to ${url}`);

  const ws = new WebSocket(url);

  ws.on("open", () => {
    console.log(`Connected to Binance WebSocket for ${symbol}`);
  });

  ws.on("message", async (data: WebSocket.Data) => {
    try {
      const tradeData = JSON.parse(data.toString()) as BinanceTrade;

      // Only process if it's a trade event
      if (tradeData.e === "trade") {
        // Parse trade data
        const timestamp = new Date(tradeData.T);
        const pair = tradeData.s.toLowerCase();
        const price = new Decimal(tradeData.p);
        const quantity = new Decimal(tradeData.q);
        const isBuyerMaker = tradeData.m;

        // Add to batch
        tradeBatch.push({
          timestamp,
          pair,
          price,
          quantity,
          isBuyerMaker,
        });

        // Flush if batch size reached
        if (tradeBatch.length >= DB_BATCH_SIZE) {
          await flushTradesToDatabase();
        }
      }
    } catch (error) {
      console.error("Error processing trade data:", error);
    }
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error for ${symbol}:`, error);
  });

  ws.on("close", (code, reason) => {
    console.log(
      `WebSocket closed for ${symbol}. Code: ${code}, Reason: ${reason}`,
    );

    // Reconnect after a delay
    setTimeout(() => {
      console.log(`Attempting to reconnect ${symbol}...`);
      createTradeWebSocket(symbol);
    }, 5000);
  });

  return ws;
}

// Main function
async function main() {
  console.log("Starting Binance Trade Data Ingestion Worker");

  try {
    // Connect to database
    await prisma.$connect();
    console.log("Connected to database");

    // Set up periodic flush
    setInterval(flushTradesToDatabase, DB_FLUSH_INTERVAL);

    // Start WebSocket connections for all symbols
    SYMBOLS.forEach((symbol) => {
      createTradeWebSocket(symbol.toLowerCase());
    });

    console.log(`Monitoring trade data for symbols: ${SYMBOLS.join(", ")}`);

    // Handle shutdown gracefully
    process.on("SIGINT", async () => {
      console.log("Shutting down...");
      await flushTradesToDatabase();
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("Shutting down...");
      await flushTradesToDatabase();
      await prisma.$disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error("Error starting worker:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Start the worker
main();
