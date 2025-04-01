/**
 * Worker Startup Script
 *
 * This script is the entry point for the PM2-managed worker process.
 * It starts the Binance WebSocket connections and maintains them.
 */

import streamManager from "./binanceStreamManager";
import { redisClient } from "./redisClient";

// Interface for connection status
interface ConnectionStatus {
  connected: boolean;
  status: string;
  reconnectAttempts: number;
  lastConnected?: number;
  lastDisconnected?: number;
  lastError?: string;
}

// Start the worker
async function startupWorker() {
  console.log("Starting Binance WebSocket worker...");

  try {
    // Ensure Redis is connected
    if (!redisClient.isReady) {
      await redisClient.connect();
      console.log("Connected to Redis server");
    }

    // Start all streams
    streamManager.startAllStreams();
    console.log("Worker started successfully");

    // Log status periodically
    setInterval(() => {
      const status = streamManager.getStatus();
      const activeConnections = Object.values(status.connections).filter(
        (conn: ConnectionStatus) => conn.connected,
      ).length;

      console.log(
        `Worker status: ${activeConnections}/${Object.keys(status.connections).length} connections active`,
      );
    }, 60000); // Log every minute
  } catch (error) {
    console.error("Failed to start worker:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down worker...");
  streamManager.stopAllStreams();

  try {
    await redisClient.disconnect();
    console.log("Redis disconnected");
  } catch (error) {
    console.error("Error disconnecting from Redis:", error);
  }

  console.log("Worker shutdown complete");
  process.exit(0);
});

// Start the worker
startupWorker().catch((error) => {
  console.error("Unhandled error in worker startup:", error);
  process.exit(1);
});
