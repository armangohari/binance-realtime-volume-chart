import { NextRequest, NextResponse } from "next/server";
import { getDBStats } from "../../../utils/dbService";

// For server-side only modules in Next.js
import {
  startDataCollection,
  stopDataCollection,
  getCollectorStatus,
} from "../../../utils/serverCollector";

// Track if the collector is running globally
let isCollectorRunning = false;

// API route to start data collection
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const data = await req.json();
    const { action, timeframe } = data;

    if (action === "start") {
      // Start data collection with the specified timeframe
      if (!isCollectorRunning) {
        await startDataCollection(timeframe);
        isCollectorRunning = true;
        return NextResponse.json({
          success: true,
          message: `Data collection started with timeframe: ${
            timeframe || "1s"
          }`,
          status: "running",
        });
      } else {
        return NextResponse.json({
          success: false,
          message: "Data collection is already running",
          status: "running",
        });
      }
    } else if (action === "stop") {
      // Stop data collection
      if (isCollectorRunning) {
        await stopDataCollection();
        isCollectorRunning = false;
        return NextResponse.json({
          success: true,
          message: "Data collection stopped",
          status: "stopped",
        });
      } else {
        return NextResponse.json({
          success: false,
          message: "Data collection is not running",
          status: "stopped",
        });
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid action. Use "start" or "stop".',
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error in collector API:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 },
    );
  }
}

// API route to get collector status
export async function GET(): Promise<NextResponse> {
  try {
    const status = {
      isRunning: isCollectorRunning,
      connections: await getCollectorStatus(),
      stats: await getDBStats(),
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error getting collector status:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 },
    );
  }
}
