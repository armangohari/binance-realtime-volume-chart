"use server";

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Define the database directory and ensure it exists
const DB_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, "binance_orderbook.db");

// Define SQLite parameter type
type SQLiteParam = string | number | null | Buffer;

// Interface for the orderbook entry in the database
export interface OrderbookEntry {
  symbol: string;
  timestamp: number;
  timeframe: string;
  buy_volume: number;
  sell_volume: number;
  event_time?: number; // Binance event time
}

// Interface for connection log entries
export interface ConnectionLog {
  timestamp: number;
  symbol: string;
  event: string; // 'connect', 'disconnect', 'error', 'reconnect_attempt'
  details?: string;
}

let db: Database.Database | null = null;

// Initialize database with required tables
export async function initDatabase(): Promise<Database.Database> {
  try {
    if (db) return db;

    console.log(`Initializing database at ${DB_PATH}`);
    db = new Database(DB_PATH);

    // Create tables if they don't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS orderbook_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        timeframe TEXT NOT NULL,
        buy_volume REAL NOT NULL,
        sell_volume REAL NOT NULL,
        event_time INTEGER,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      );
      
      CREATE INDEX IF NOT EXISTS idx_orderbook_symbol_timestamp 
      ON orderbook_data (symbol, timestamp);
      
      CREATE TABLE IF NOT EXISTS connection_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        event TEXT NOT NULL,
        details TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      );
      
      CREATE INDEX IF NOT EXISTS idx_connection_logs_timestamp 
      ON connection_logs (timestamp);
    `);

    return db;
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// Save orderbook data to database
export async function saveOrderbookData(
  entry: OrderbookEntry
): Promise<number> {
  try {
    const database = await initDatabase();

    const stmt = database.prepare(`
      INSERT INTO orderbook_data 
      (symbol, timestamp, timeframe, buy_volume, sell_volume, event_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      entry.symbol,
      entry.timestamp,
      entry.timeframe,
      entry.buy_volume,
      entry.sell_volume,
      entry.event_time || null
    );

    return result.lastInsertRowid as number;
  } catch (error) {
    console.error("Error saving orderbook data:", error);
    throw error;
  }
}

// Save connection log entry
export async function logConnection(log: ConnectionLog): Promise<number> {
  try {
    const database = await initDatabase();

    const stmt = database.prepare(`
      INSERT INTO connection_logs 
      (timestamp, symbol, event, details)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      log.timestamp,
      log.symbol,
      log.event,
      log.details || null
    );

    return result.lastInsertRowid as number;
  } catch (error) {
    console.error("Error logging connection:", error);
    throw error;
  }
}

// Get orderbook data for a specific symbol and time range
export async function getOrderbookData(
  symbol: string,
  startTime: number,
  endTime: number,
  timeframe?: string
): Promise<OrderbookEntry[]> {
  try {
    const database = await initDatabase();

    let query = `
      SELECT symbol, timestamp, timeframe, buy_volume, sell_volume, event_time
      FROM orderbook_data
      WHERE symbol = ? AND timestamp BETWEEN ? AND ?
    `;

    const params: SQLiteParam[] = [symbol, startTime, endTime];

    if (timeframe) {
      query += " AND timeframe = ?";
      params.push(timeframe);
    }

    query += " ORDER BY timestamp ASC";

    const stmt = database.prepare(query);
    return stmt.all(...params) as OrderbookEntry[];
  } catch (error) {
    console.error("Error getting orderbook data:", error);
    throw error;
  }
}

// Get available symbols in the database
export async function getAvailableSymbols(): Promise<string[]> {
  try {
    const database = await initDatabase();

    const stmt = database.prepare(`
      SELECT DISTINCT symbol FROM orderbook_data
    `);

    const rows = stmt.all() as { symbol: string }[];
    return rows.map((row) => row.symbol);
  } catch (error) {
    console.error("Error getting available symbols:", error);
    throw error;
  }
}

// Get connection logs for analysis
export async function getConnectionLogs(
  startTime?: number,
  endTime?: number,
  symbol?: string,
  event?: string
): Promise<ConnectionLog[]> {
  try {
    const database = await initDatabase();

    let query = `
      SELECT timestamp, symbol, event, details
      FROM connection_logs
      WHERE 1=1
    `;

    const params: SQLiteParam[] = [];

    if (startTime) {
      query += " AND timestamp >= ?";
      params.push(startTime);
    }

    if (endTime) {
      query += " AND timestamp <= ?";
      params.push(endTime);
    }

    if (symbol) {
      query += " AND symbol = ?";
      params.push(symbol);
    }

    if (event) {
      query += " AND event = ?";
      params.push(event);
    }

    query += " ORDER BY timestamp DESC";

    const stmt = database.prepare(query);
    return stmt.all(...params) as ConnectionLog[];
  } catch (error) {
    console.error("Error getting connection logs:", error);
    throw error;
  }
}

// Get database statistics
export async function getDBStats(): Promise<{
  totalEntries: number;
  entriesBySymbol: Record<string, number>;
  oldestEntry: number;
  newestEntry: number;
}> {
  try {
    const database = await initDatabase();

    const totalEntries = database
      .prepare("SELECT COUNT(*) as count FROM orderbook_data")
      .get() as { count: number };

    const entriesBySymbol = database
      .prepare(
        "SELECT symbol, COUNT(*) as count FROM orderbook_data GROUP BY symbol"
      )
      .all() as { symbol: string; count: number }[];

    const timeRange = database
      .prepare(
        "SELECT MIN(timestamp) as oldest, MAX(timestamp) as newest FROM orderbook_data"
      )
      .get() as { oldest: number; newest: number };

    // Format entries by symbol into a record
    const entriesBySymbolRecord: Record<string, number> = {};
    entriesBySymbol.forEach((item) => {
      entriesBySymbolRecord[item.symbol] = item.count;
    });

    return {
      totalEntries: totalEntries.count,
      entriesBySymbol: entriesBySymbolRecord,
      oldestEntry: timeRange.oldest || 0,
      newestEntry: timeRange.newest || 0,
    };
  } catch (error) {
    console.error("Error getting database stats:", error);
    throw error;
  }
}

// Close the database connection properly
export async function closeDatabase(): Promise<void> {
  if (db) {
    try {
      db.close();
      db = null;
    } catch (error) {
      console.error("Error closing database:", error);
    }
  }
}
