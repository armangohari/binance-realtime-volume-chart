import { NextResponse } from "next/server";
import { redisClient } from "../../../services/redisClient";
import streamManager from "../../../services/binanceStreamManager";

export async function GET() {
  try {
    // Check Redis connection
    let redisStatus = "disconnected";
    try {
      if (redisClient.isReady) {
        await redisClient.ping();
        redisStatus = "connected";
      }
    } catch (redisError) {
      console.error("Redis health check error:", redisError);
      redisStatus = "error";
    }

    // Get WebSocket status
    const wsStatus = streamManager.getStatus();

    // Get system information
    const memoryUsage = process.memoryUsage();

    return NextResponse.json({
      status: "ok",
      timestamp: Date.now(),
      redis: redisStatus,
      websockets: wsStatus,
      system: {
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + "MB",
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + "MB",
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + "MB",
        },
        uptime: Math.round(process.uptime()) + "s",
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
      },
      { status: 500 },
    );
  }
}
