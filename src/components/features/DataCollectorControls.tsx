"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

// Available timeframes in seconds (must match options in serverCollector.ts)
const TIMEFRAMES = {
  "1s": 1,
  "5s": 5,
  "15s": 15,
  "30s": 30,
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
};

// Connection status interface
interface ConnectionStatus {
  status: string;
  reconnectCount: number;
  lastConnected?: number;
  lastDisconnected?: number;
  lastError?: string;
}

// Stats interface
interface DatabaseStats {
  totalEntries: number;
  entriesBySymbol: Record<string, number>;
  oldestEntry: number;
  newestEntry: number;
}

// Collector status interface
interface CollectorStatus {
  isRunning: boolean;
  connections: Record<string, ConnectionStatus>;
  stats: DatabaseStats;
}

export default function DataCollectorControls() {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1s");
  const [status, setStatus] = useState<Partial<CollectorStatus>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Constants for styling
  const cardBgColor = "bg-[#0f1217]";
  const borderColor = "border-[#252830]";
  const controlBgColor = "bg-[#161b24]";
  const controlBorderColor = "border-[#252a36]";

  // Fetch the current status of the collector
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/collector");
      setStatus(response.data);
      setIsRunning(response.data.isRunning);
      setError(null);
    } catch (error) {
      console.error("Error fetching collector status:", error);
      setError("Failed to fetch collector status");
    } finally {
      setLoading(false);
    }
  };

  // Start or stop data collection
  const toggleCollection = async () => {
    try {
      setLoading(true);
      const action = isRunning ? "stop" : "start";

      const response = await axios.post("/api/collector", {
        action,
        timeframe: selectedTimeframe,
      });

      if (response.data.success) {
        setIsRunning(action === "start");
        await fetchStatus(); // Refresh status after action
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Error toggling collection:", error);
      setError("Failed to toggle data collection");
    } finally {
      setLoading(false);
    }
  };

  // Load initial status on component mount
  useEffect(() => {
    fetchStatus();

    // Set up regular status polling
    const intervalId = setInterval(() => {
      fetchStatus();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Format connection status for display
  const formatConnectionStatus = (status: string) => {
    switch (status) {
      case "connected":
        return <span className="font-medium text-green-500">Connected</span>;
      case "connecting":
        return (
          <span className="font-medium text-yellow-500">Connecting...</span>
        );
      case "disconnected":
        return <span className="font-medium text-red-500">Disconnected</span>;
      case "error":
        return <span className="font-medium text-red-500">Error</span>;
      default:
        return <span className="font-medium text-gray-500">Unknown</span>;
    }
  };

  // Format timestamps for display
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className={`w-full ${cardBgColor} mb-6 rounded-lg p-4 shadow-md`}>
      <h2 className="mb-4 text-xl font-bold">Data Collector Controls</h2>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium">Timeframe</label>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            disabled={isRunning || loading}
            className={`w-full rounded p-2 ${controlBgColor} ${controlBorderColor} border`}
          >
            {Object.keys(TIMEFRAMES).map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 items-end">
          <button
            onClick={toggleCollection}
            disabled={loading}
            className={`w-full rounded p-2 font-medium transition-colors ${
              isRunning
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading
              ? "Working..."
              : isRunning
                ? "Stop Collection"
                : "Start Collection"}
          </button>
        </div>

        <div className="flex flex-1 items-end">
          <Link
            href="/dbviewer"
            className={`w-full rounded bg-gray-700 p-2 text-center font-medium transition-colors hover:bg-gray-600`}
          >
            View Database
          </Link>
        </div>
      </div>

      {/* Status display */}
      {error && (
        <div className="mb-4 rounded border border-red-800 bg-red-900/50 p-3">
          {error}
        </div>
      )}

      {status && (
        <div>
          <h3 className="mb-2 text-lg font-medium">Status</h3>

          {/* Database stats */}
          {status.stats && (
            <div
              className={`mb-4 p-3 ${controlBgColor} rounded border ${borderColor}`}
            >
              <h4 className="mb-2 font-medium">Database</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm">
                    <span className="text-gray-400">Total entries:</span>{" "}
                    {status.stats.totalEntries.toLocaleString()}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-400">Time range:</span>{" "}
                    {status.stats.oldestEntry > 0
                      ? `${formatTimestamp(
                          status.stats.oldestEntry,
                        )} - ${formatTimestamp(status.stats.newestEntry)}`
                      : "No data"}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-sm font-medium">Entries by symbol:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(status.stats.entriesBySymbol || {}).map(
                      ([symbol, count]) => (
                        <p key={symbol} className="text-sm">
                          <span className="text-gray-400">{symbol}:</span>{" "}
                          {Number(count).toLocaleString()}
                        </p>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connection status */}
          {status.connections && (
            <div
              className={`p-3 ${controlBgColor} rounded border ${borderColor}`}
            >
              <h4 className="mb-2 font-medium">Connections</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-2 text-left">Symbol</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Reconnect Count</th>
                      <th className="p-2 text-left">Last Connected</th>
                      <th className="p-2 text-left">Last Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(status.connections).map(
                      ([symbol, conn]) => (
                        <tr key={symbol} className="border-b border-gray-800">
                          <td className="p-2 uppercase">{symbol}</td>
                          <td className="p-2">
                            {formatConnectionStatus(conn.status)}
                          </td>
                          <td className="p-2">{conn.reconnectCount || 0}</td>
                          <td className="p-2">
                            {formatTimestamp(conn.lastConnected)}
                          </td>
                          <td className="p-2 text-red-400">
                            {conn.lastError || "None"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
