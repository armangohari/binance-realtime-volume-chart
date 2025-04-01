"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VolumeChart } from "../../../../components/VolumeChart";

interface VolumeData {
  timestamp: number;
  buyVolume: number;
  sellVolume: number;
}

interface ConnectionStatus {
  connected: boolean;
  status: string;
  reconnectAttempts: number;
  lastConnected?: number;
  lastDisconnected?: number;
  lastError?: string;
}

interface WorkerStatus {
  isRunning: boolean;
  connections: Record<string, ConnectionStatus>;
}

export default function VolumePage() {
  const { symbol, timeframe } = useParams() as {
    symbol: string;
    timeframe: string;
  };

  const [data, setData] = useState<VolumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeframes = ["1s", "5s", "15s", "30s", "1m", "5m", "15m", "30m", "1h"];
  const symbols = [
    "btcusdt",
    "ethusdt",
    "solusdt",
    "xrpusdt",
    "dogeusdt",
    "adausdt",
  ];
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);

  // Fetch volume data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Calculate time range (last hour)
      const end = Date.now();
      const start = end - 3600000; // 1 hour ago

      const response = await fetch(
        `/api/volume/${symbol}/${timeframe}?start=${start}&end=${end}`,
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.message || "Failed to fetch data");
        setData([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Check worker status
  const checkWorkerStatus = async () => {
    try {
      const response = await fetch("/api/worker");
      const result = await response.json();

      if (result.success) {
        setWorkerStatus(result.status);
      }
    } catch (err) {
      console.error("Failed to check worker status:", err);
    }
  };

  // Start the worker
  const startWorker = async () => {
    try {
      const response = await fetch("/api/worker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "start" }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Worker started successfully");
        checkWorkerStatus();
      } else {
        alert(`Failed to start worker: ${result.message}`);
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // Stop the worker
  const stopWorker = async () => {
    try {
      const response = await fetch("/api/worker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "stop" }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Worker stopped successfully");
        checkWorkerStatus();
      } else {
        alert(`Failed to stop worker: ${result.message}`);
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
    checkWorkerStatus();

    // Set up polling
    const interval = setInterval(() => {
      fetchData();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [symbol, timeframe, fetchData]);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">
          {symbol.toUpperCase()} Volume Chart
        </h1>
        <p className="text-gray-400">
          Real-time volume data from Binance WebSocket
        </p>

        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="symbol-select" className="text-sm font-medium">
              Symbol:
            </label>
            <select
              id="symbol-select"
              value={symbol}
              onChange={(e) => {
                window.location.href = `/volume/${e.target.value}/${timeframe}`;
              }}
              className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm"
            >
              {symbols.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="timeframe-select" className="text-sm font-medium">
              Timeframe:
            </label>
            <select
              id="timeframe-select"
              value={timeframe}
              onChange={(e) => {
                window.location.href = `/volume/${symbol}/${e.target.value}`;
              }}
              className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm"
            >
              {timeframes.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchData}
            className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium hover:bg-blue-700"
          >
            Refresh Data
          </button>

          <button
            onClick={workerStatus?.isRunning ? stopWorker : startWorker}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              workerStatus?.isRunning
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {workerStatus?.isRunning ? "Stop" : "Start"} Worker
          </button>
        </div>
      </div>

      {loading && (
        <div className="my-12 flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="my-4 rounded-md border border-red-700 bg-red-900/30 p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="my-4 rounded-md border border-yellow-700 bg-yellow-900/30 p-4">
          <p className="text-yellow-400">
            No data available. Make sure the worker is running and collecting
            data for this symbol.
          </p>
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="my-4">
          <VolumeChart data={data} symbol={symbol} timeframe={timeframe} />

          <div className="mt-4 rounded-md border border-gray-700 bg-gray-800 p-4">
            <h3 className="mb-2 text-lg font-medium">Statistics</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-400">Total Buy Volume</p>
                <p className="text-xl font-medium">
                  {data
                    .reduce((sum, item) => sum + item.buyVolume, 0)
                    .toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Sell Volume</p>
                <p className="text-xl font-medium">
                  {data
                    .reduce((sum, item) => sum + item.sellVolume, 0)
                    .toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Buy/Sell Ratio</p>
                <p className="text-xl font-medium">
                  {(
                    data.reduce((sum, item) => sum + item.buyVolume, 0) /
                    data.reduce((sum, item) => sum + item.sellVolume, 0)
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Worker Status */}
      {workerStatus && (
        <div className="mt-8 rounded-md border border-gray-700 bg-gray-800 p-4">
          <h3 className="mb-2 text-lg font-medium">Worker Status</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p
                className={`text-xl font-medium ${workerStatus.isRunning ? "text-green-500" : "text-red-500"}`}
              >
                {workerStatus.isRunning ? "Running" : "Stopped"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Connections</p>
              <p className="text-xl font-medium">
                {
                  Object.values(workerStatus.connections).filter(
                    (conn) => conn.connected,
                  ).length
                }
                /{Object.keys(workerStatus.connections).length}
              </p>
            </div>
          </div>

          {/* Connection Details */}
          <div className="mt-4">
            <h4 className="text-md mb-2 font-medium">Connection Details</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Symbol
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Reconnect Attempts
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Last Connected
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {workerStatus.connections &&
                    Object.entries(workerStatus.connections).map(
                      ([key, conn]) => (
                        <tr key={key}>
                          <td className="whitespace-nowrap px-4 py-2">
                            {key.toUpperCase()}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                conn.connected
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {conn.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2">
                            {conn.reconnectAttempts}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2">
                            {conn.lastConnected
                              ? new Date(
                                  conn.lastConnected,
                                ).toLocaleTimeString()
                              : "Never"}
                          </td>
                        </tr>
                      ),
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
