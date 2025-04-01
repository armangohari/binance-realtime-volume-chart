"use client";

import { useState } from "react";
import axios from "axios";
import { OrderbookApiResponse } from "./ChartContainer";

interface HistoricalDataSelectorProps {
  onDataLoad: (data: OrderbookApiResponse) => void;
}

export default function HistoricalDataSelector({
  onDataLoad,
}: HistoricalDataSelectorProps) {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1m");
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().slice(0, 16),
  );
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalData = async () => {
    if (!symbol || !timeframe || !startDate || !endDate) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();

    try {
      const response = await axios.get(
        `/api/historical?symbol=${symbol}&timeframe=${timeframe}&startTime=${startTimestamp}&endTime=${endTimestamp}`,
      );

      if (response.data.success) {
        onDataLoad(response.data);
      } else {
        setError(response.data.message || "Failed to load data");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const popularSymbols = [
    "BTCUSDT",
    "ETHUSDT",
    "BNBUSDT",
    "SOLUSDT",
    "ADAUSDT",
  ];

  const timeframes = [
    { value: "1m", label: "1 minute" },
    { value: "5m", label: "5 minutes" },
    { value: "15m", label: "15 minutes" },
    { value: "1h", label: "1 hour" },
    { value: "4h", label: "4 hours" },
    { value: "1d", label: "1 day" },
  ];

  return (
    <div className="border-border/40 bg-card rounded-lg border p-4 shadow-sm md:p-6">
      <h2 className="mb-4 text-xl font-semibold tracking-tight">
        Historical Data
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-2">
          <label
            htmlFor="symbol"
            className="block text-sm font-medium text-foreground"
          >
            Symbol
          </label>
          <select
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="border-input focus:border-primary focus:ring-primary w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1"
          >
            {popularSymbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value="custom">Custom...</option>
          </select>
          {symbol === "custom" && (
            <input
              type="text"
              placeholder="Enter symbol (e.g. DOGEUSDT)"
              onChange={(e) => setSymbol(e.target.value)}
              className="border-input focus:border-primary focus:ring-primary w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1"
            />
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="timeframe"
            className="block text-sm font-medium text-foreground"
          >
            Timeframe
          </label>
          <select
            id="timeframe"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border-input focus:border-primary focus:ring-primary w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1"
          >
            {timeframes.map((tf) => (
              <option key={tf.value} value={tf.value}>
                {tf.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-foreground"
          >
            Start Date & Time
          </label>
          <input
            id="startDate"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border-input focus:border-primary focus:ring-primary w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-foreground"
          >
            End Date & Time
          </label>
          <input
            id="endDate"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border-input focus:border-primary focus:ring-primary w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1"
          />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive mt-4 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={fetchHistoricalData}
          disabled={isLoading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/30 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  fill="currentColor"
                ></path>
              </svg>
              Loading...
            </>
          ) : (
            "Load Data"
          )}
        </button>
      </div>
    </div>
  );
}
