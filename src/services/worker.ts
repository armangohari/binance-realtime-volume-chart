"use server";

import streamManager from "./binanceStreamManager";
import { redisClient } from "./redisClient";

// Function to start the WebSocket worker
export async function startWorker() {
  console.log("Starting Binance WebSocket worker...");

  try {
    // Ensure Redis is connected
    if (!redisClient.isReady) {
      await redisClient.connect();
      console.log("Connected to Redis server");
    }

    // Start all streams
    streamManager.startAllStreams();

    return {
      success: true,
      message: "Binance WebSocket worker started successfully",
      status: streamManager.getStatus(),
    };
  } catch (error) {
    console.error("Failed to start worker:", error);
    return {
      success: false,
      message: `Failed to start worker: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Function to stop the WebSocket worker
export async function stopWorker() {
  console.log("Stopping Binance WebSocket worker...");

  try {
    // Stop all streams
    streamManager.stopAllStreams();

    return {
      success: true,
      message: "Binance WebSocket worker stopped successfully",
    };
  } catch (error) {
    console.error("Failed to stop worker:", error);
    return {
      success: false,
      message: `Failed to stop worker: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Function to get the current status of the worker
export async function getWorkerStatus() {
  try {
    return {
      success: true,
      status: streamManager.getStatus(),
      redisConnected: redisClient.isReady,
    };
  } catch (error) {
    console.error("Failed to get worker status:", error);
    return {
      success: false,
      message: `Failed to get worker status: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
