"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { MdDownload, MdStorage, MdTableView } from "react-icons/md";
import { LayoutWrapper } from "@/components/ui/layout-wrapper";

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
    "orderbook",
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
    activeData.forEach((item: ConnectionLog | OrderbookEntry) => {
      const row = headers.map((header) => {
        const value = item[header as keyof typeof item];
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
      `${activeTab}_data_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <LayoutWrapper>
      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Database Viewer
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Browse and export collected market data
          </p>
        </div>

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <button
              className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                activeTab === "orderbook"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              onClick={() => setActiveTab("orderbook")}
            >
              <MdTableView className="mr-2 h-4 w-4" />
              Orderbook Data
            </button>
            <button
              className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                activeTab === "connections"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              onClick={() => setActiveTab("connections")}
            >
              <MdStorage className="mr-2 h-4 w-4" />
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
            className="bg-success text-success-foreground hover:bg-success/90 focus:ring-success/20 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <MdDownload className="mr-2 h-4 w-4" />
            Export to CSV
          </button>
        </div>

        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
              <span className="text-muted-foreground">Loading data...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive rounded-md p-4">
            {error}
          </div>
        ) : (
          <div className="border-border/40 bg-card rounded-lg border shadow-sm">
            {activeTab === "orderbook" ? (
              <>
                <div className="border-border/40 bg-muted/40 flex items-center justify-between border-b px-4 py-3">
                  <h2 className="text-lg font-medium">
                    Orderbook Data ({orderbookData.length} entries)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-border/40 bg-muted/30 border-b">
                        <th className="whitespace-nowrap p-3 text-left font-medium">
                          ID
                        </th>
                        <th className="whitespace-nowrap p-3 text-left font-medium">
                          Symbol
                        </th>
                        <th className="whitespace-nowrap p-3 text-left font-medium">
                          Timestamp
                        </th>
                        <th className="whitespace-nowrap p-3 text-left font-medium">
                          Timeframe
                        </th>
                        <th className="whitespace-nowrap p-3 text-left font-medium">
                          Buy Volume
                        </th>
                        <th className="whitespace-nowrap p-3 text-left font-medium">
                          Sell Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderbookData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-muted-foreground p-4 text-center"
                          >
                            No orderbook data available
                          </td>
                        </tr>
                      ) : (
                        orderbookData.map((entry) => (
                          <tr
                            key={entry.id}
                            className="border-border/20 hover:bg-muted/20 border-b"
                          >
                            <td className="whitespace-nowrap p-3">
                              {entry.id}
                            </td>
                            <td className="whitespace-nowrap p-3 uppercase">
                              {entry.symbol}
                            </td>
                            <td className="whitespace-nowrap p-3">
                              {formatTimestamp(entry.timestamp)}
                            </td>
                            <td className="whitespace-nowrap p-3">
                              {entry.timeframe}
                            </td>
                            <td className="text-primary whitespace-nowrap p-3">
                              {formatVolume(entry.buy_volume)}
                            </td>
                            <td className="text-destructive whitespace-nowrap p-3">
                              {formatVolume(entry.sell_volume)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <div className="border-border/40 bg-muted/40 flex items-center justify-between border-b px-4 py-3">
                  <h2 className="text-lg font-medium">
                    Connection Logs ({connectionLogs.length} entries)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-border/40 bg-muted/30 border-b">
                        <th className="whitespace-nowrap p-3 text-left font-medium">
                          ID
                        </th>
                        <th className="whitespace-nowrap p-3 text-left font-medium">
                          Timestamp
                        </th>
                        <th className="whitespace-nowrap p-3 text-left font-medium">
                          Symbol
                        </th>
                        <th className="whitespace-nowrap p-3 text-left font-medium">
                          Event
                        </th>
                        <th className="whitespace-nowrap p-3 text-left font-medium">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {connectionLogs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-muted-foreground p-4 text-center"
                          >
                            No connection logs available
                          </td>
                        </tr>
                      ) : (
                        connectionLogs.map((log) => (
                          <tr
                            key={log.id}
                            className="border-border/20 hover:bg-muted/20 border-b"
                          >
                            <td className="whitespace-nowrap p-3">{log.id}</td>
                            <td className="whitespace-nowrap p-3">
                              {formatTimestamp(log.timestamp)}
                            </td>
                            <td className="whitespace-nowrap p-3 uppercase">
                              {log.symbol}
                            </td>
                            <td className="whitespace-nowrap p-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                  log.event.includes("error") ||
                                  log.event.includes("disconnect")
                                    ? "bg-destructive/10 text-destructive"
                                    : log.event.includes("connect") ||
                                        log.event.includes("start")
                                      ? "bg-success/10 text-success"
                                      : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {log.event}
                              </span>
                            </td>
                            <td className="text-muted-foreground p-3">
                              {log.details || "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
