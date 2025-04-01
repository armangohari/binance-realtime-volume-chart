import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "binance_orderbook.db");

// API route to get database data
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Check if database exists
    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json(
        {
          success: false,
          message: "Database file not found",
        },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(req.url);
    const table = searchParams.get("table") || "orderbook";
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const symbol = searchParams.get("symbol");

    // Open database connection
    const db = new Database(DB_PATH);

    let query = "";
    const params: (string | number)[] = [];

    if (table === "orderbook") {
      query = `
        SELECT id, symbol, timestamp, timeframe, buy_volume, sell_volume, event_time, created_at
        FROM orderbook_data
        WHERE 1=1
      `;

      if (symbol) {
        query += " AND symbol = ?";
        params.push(symbol);
      }

      query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);
    } else if (table === "connections") {
      query = `
        SELECT id, timestamp, symbol, event, details, created_at
        FROM connection_logs
        WHERE 1=1
      `;

      if (symbol) {
        query += " AND symbol = ?";
        params.push(symbol);
      }

      query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid table parameter",
        },
        { status: 400 },
      );
    }

    // Execute query
    const stmt = db.prepare(query);
    const data = stmt.all(...params);

    // Get total count for pagination
    let countQuery = "";
    const countParams: string[] = [];

    if (table === "orderbook") {
      countQuery = "SELECT COUNT(*) as count FROM orderbook_data WHERE 1=1";

      if (symbol) {
        countQuery += " AND symbol = ?";
        countParams.push(symbol);
      }
    } else {
      countQuery = "SELECT COUNT(*) as count FROM connection_logs WHERE 1=1";

      if (symbol) {
        countQuery += " AND symbol = ?";
        countParams.push(symbol);
      }
    }

    const countStmt = db.prepare(countQuery);
    const { count } = countStmt.get(...countParams) as { count: number };

    // Close database connection
    db.close();

    return NextResponse.json({
      success: true,
      data,
      meta: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count,
      },
    });
  } catch (error) {
    console.error("Error fetching database data:", error);
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
