"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { OrderbookApiResponse } from "./ChartContainer";

interface HistoricalDataSelectorProps {
  onDataLoad: (data: OrderbookApiResponse) => void;
}

interface DataStats {
  count: number;
  symbol: string;
  timeframe: string;
}

export default function HistoricalDataSelector({
  onDataLoad,
}: HistoricalDataSelectorProps) {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [timeframe, setTimeframe] = useState<string>("1s");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataStats, setDataStats] = useState<DataStats | null>(null);

  // Constants for styling
  const cardBgColor = "bg-[#0f1217]";
  const borderColor = "border-[#252830]";
  const controlBgColor = "bg-[#161b24]";
  const controlBorderColor = "border-[#252a36]";

  // Available timeframes in seconds
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

  // Format date for input
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().slice(0, 16);
  };

  // Initialize with default dates (last hour)
  useEffect(() => {
    const now = new Date();
    const oneHourAgo = new Date(now);
    oneHourAgo.setHours(now.getHours() - 1);

    setStartDate(formatDateForInput(oneHourAgo));
    setEndDate(formatDateForInput(now));

    // Load available symbols
    fetchSymbols();
  }, []);

  // Fetch available symbols from the database
  const fetchSymbols = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/orderbook?action=symbols");
      if (response.data.symbols && response.data.symbols.length > 0) {
        setSymbols(response.data.symbols);
        setSelectedSymbol(response.data.symbols[0]);
      }
      setError(null);
    } catch (error) {
      console.error("Error fetching symbols:", error);
      setError("Failed to fetch available symbols");
    } finally {
      setLoading(false);
    }
  };

  // Load historical data
  const loadData = async () => {
    if (!selectedSymbol || !startDate || !endDate) {
      setError("Please select a symbol, start date, and end date");
      return;
    }

    try {
      setLoading(true);
      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = new Date(endDate).getTime();

      if (isNaN(startTimestamp) || isNaN(endTimestamp)) {
        setError("Invalid date format");
        return;
      }

      if (startTimestamp >= endTimestamp) {
        setError("Start date must be before end date");
        return;
      }

      const response = await axios.get<OrderbookApiResponse>("/api/orderbook", {
        params: {
          symbol: selectedSymbol,
          startTime: startTimestamp,
          endTime: endTimestamp,
          timeframe,
        },
      });

      if (response.data.success) {
        onDataLoad(response.data);
        setDataStats({
          count: response.data.count,
          symbol: response.data.symbol,
          timeframe: response.data.timeframe,
        });
        setError(null);
      } else {
        setError(response.data.message || "Failed to load data");
      }
    } catch (error) {
      console.error("Error loading historical data:", error);
      setError("Failed to load historical data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${cardBgColor} rounded-lg shadow-md p-4 mb-6`}>
      <h2 className="text-xl font-bold mb-4">Historical Data Viewer</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        {/* Symbol selector */}
        <div>
          <label className="block mb-1 text-sm font-medium">Symbol</label>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            disabled={loading || symbols.length === 0}
            className={`w-full p-2 rounded ${controlBgColor} ${controlBorderColor} border`}
          >
            {symbols.length === 0 ? (
              <option value="">No symbols available</option>
            ) : (
              symbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol.toUpperCase()}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Start date */}
        <div>
          <label className="block mb-1 text-sm font-medium">Start Date</label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={loading}
            className={`w-full p-2 rounded ${controlBgColor} ${controlBorderColor} border`}
          />
        </div>

        {/* End date */}
        <div>
          <label className="block mb-1 text-sm font-medium">End Date</label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={loading}
            className={`w-full p-2 rounded ${controlBgColor} ${controlBorderColor} border`}
          />
        </div>

        {/* Timeframe */}
        <div>
          <label className="block mb-1 text-sm font-medium">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            disabled={loading}
            className={`w-full p-2 rounded ${controlBgColor} ${controlBorderColor} border`}
          >
            {Object.keys(TIMEFRAMES).map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        </div>

        {/* Load button */}
        <div className="flex items-end">
          <button
            onClick={loadData}
            disabled={loading || !selectedSymbol}
            className={`w-full p-2 rounded font-medium transition-colors ${
              loading ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Loading..." : "Load Data"}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 mb-4 bg-red-900/50 border border-red-800 rounded">
          {error}
        </div>
      )}

      {/* Stats display */}
      {dataStats && (
        <div
          className={`p-3 ${controlBgColor} rounded border ${borderColor} text-sm`}
        >
          <p>
            Loaded <strong>{dataStats.count.toLocaleString()}</strong> data
            points for <strong>{dataStats.symbol.toUpperCase()}</strong> with
            timeframe <strong>{dataStats.timeframe}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
