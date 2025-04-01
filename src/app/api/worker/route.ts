import { NextRequest, NextResponse } from "next/server";
import {
  startWorker,
  stopWorker,
  getWorkerStatus,
} from "../../../services/worker";

// API route to start/stop the worker
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const data = await req.json();
    const { action } = data;

    if (action === "start") {
      // Start the worker
      const result = await startWorker();

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message,
          status: result.status,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: result.message,
          },
          { status: 500 },
        );
      }
    } else if (action === "stop") {
      // Stop the worker
      const result = await stopWorker();

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: result.message,
          },
          { status: 500 },
        );
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
    console.error("Error in worker API:", error);
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

// API route to get worker status
export async function GET(): Promise<NextResponse> {
  try {
    const status = await getWorkerStatus();

    if (status.success) {
      return NextResponse.json(status);
    } else {
      return NextResponse.json(
        {
          success: false,
          message: status.message,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error getting worker status:", error);
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
