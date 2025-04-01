"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

interface OrderbookEntry {
  id: number;
  symbol: string;
  timestamp: number;
  timeframe: string;
  buy_volume: number;
  sell_volume: number;
  event_time?: number;
  created_at: number;
}

interface ConnectionLog {
  id: number;
  timestamp: number;
  symbol: string;
  event: string;
  details?: string;
  created_at: number;
}

export default function DBViewer() {
  const [orderbookData, setOrderbookData] = useState<OrderbookEntry[]>([]);
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"orderbook" | "connections">(
    "orderbook"
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch data based on active tab
        const endpoint =
          activeTab === "orderbook"
            ? "/api/dbviewer?table=orderbook"
            : "/api/dbviewer?table=connections";

        const response = await axios.get(endpoint);

        if (activeTab === "orderbook") {
          setOrderbookData(response.data.data || []);
        } else {
          setConnectionLogs(response.data.data || []);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching database data:", err);
        setError("Failed to load database data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatVolume = (volume: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(volume);
  };

  // Function to export data as CSV
  const exportToCSV = () => {
    const activeData =
      activeTab === "orderbook" ? orderbookData : connectionLogs;
    if (!activeData.length) return;

    let csvContent = "";
    let headers = [];

    // Set headers based on active tab
    if (activeTab === "orderbook") {
      headers = [
        "id",
        "symbol",
        "timestamp",
        "timeframe",
        "buy_volume",
        "sell_volume",
        "event_time",
        "created_at",
      ];
    } else {
      headers = ["id", "timestamp", "symbol", "event", "details", "created_at"];
    }

    // Add headers
    csvContent += headers.join(",") + "\n";

    // Add data rows
    activeData.forEach((item: any) => {
      const row = headers.map((header) => {
        const value = item[header];
        // Handle string values that might contain commas
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return value !== undefined && value !== null ? value : "";
      });
      csvContent += row.join(",") + "\n";
    });

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${activeTab}_data_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#060a10] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Database Viewer</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="flex justify-between mb-4">
          <div className="flex gap-4">
            <button
              className={`px-4 py-2 rounded-md ${
                activeTab === "orderbook"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
              onClick={() => setActiveTab("orderbook")}
            >
              Orderbook Data
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                activeTab === "connections"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
              onClick={() => setActiveTab("connections")}
            >
              Connection Logs
            </button>
          </div>

          <button
            onClick={exportToCSV}
            disabled={
              loading ||
              error !== null ||
              (activeTab === "orderbook"
                ? !orderbookData.length
                : !connectionLogs.length)
            }
            className={`px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 transition-colors ${
              loading ||
              error !== null ||
              (activeTab === "orderbook"
                ? !orderbookData.length
                : !connectionLogs.length)
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            Export to CSV
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-800 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <div className="bg-[#0f1217] rounded-lg shadow-lg border border-[#252830] overflow-hidden">
            {activeTab === "orderbook" ? (
              <>
                <h2 className="text-xl p-4 bg-[#161b24] border-b border-[#252830]">
                  Orderbook Data ({orderbookData.length} entries)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#252830]">
                        <th className="p-3 text-left">ID</th>
                        <th className="p-3 text-left">Symbol</th>
                        <th className="p-3 text-left">Timestamp</th>
                        <th className="p-3 text-left">Timeframe</th>
                        <th className="p-3 text-left">Buy Volume</th>
                        <th className="p-3 text-left">Sell Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderbookData.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-[#1a1d25] hover:bg-[#171c25]"
                        >
                          <td className="p-3">{entry.id}</td>
                          <td className="p-3 uppercase">{entry.symbol}</td>
                          <td className="p-3">
                            {formatTimestamp(entry.timestamp)}
                          </td>
                          <td className="p-3">{entry.timeframe}</td>
                          <td className="p-3 text-[#0190FF]">
                            {formatVolume(entry.buy_volume)}
                          </td>
                          <td className="p-3 text-[#FF3B69]">
                            {formatVolume(entry.sell_volume)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl p-4 bg-[#161b24] border-b border-[#252830]">
                  Connection Logs ({connectionLogs.length} entries)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#252830]">
                        <th className="p-3 text-left">ID</th>
                        <th className="p-3 text-left">Symbol</th>
                        <th className="p-3 text-left">Timestamp</th>
                        <th className="p-3 text-left">Event</th>
                        <th className="p-3 text-left">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {connectionLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-[#1a1d25] hover:bg-[#171c25]"
                        >
                          <td className="p-3">{log.id}</td>
                          <td className="p-3 uppercase">{log.symbol}</td>
                          <td className="p-3">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs ${
                                log.event === "connect"
                                  ? "bg-green-900 text-green-300"
                                  : log.event === "disconnect"
                                  ? "bg-red-900 text-red-300"
                                  : log.event === "error"
                                  ? "bg-orange-900 text-orange-300"
                                  : "bg-blue-900 text-blue-300"
                              }`}
                            >
                              {log.event}
                            </span>
                          </td>
                          <td className="p-3 text-gray-400 max-w-sm truncate">
                            {log.details || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
