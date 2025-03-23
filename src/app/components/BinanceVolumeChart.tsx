"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  HistogramSeries,
  ColorType,
  ISeriesApi,
  UTCTimestamp,
} from "lightweight-charts";
import {
  VolumeData,
  getDepthStreamUrl,
  processDepthData,
  formatTimestamp,
  formatVolume,
  BinanceDepthUpdate,
} from "../utils/binanceUtils";

// Timeframe options in seconds
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

// Define interfaces for our chart references
interface ChartComponents {
  chart: ReturnType<typeof createChart>;
  buySeries: ISeriesApi<"Histogram">;
  sellSeries: ISeriesApi<"Histogram">;
}

export default function BinanceVolumeChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartComponents = useRef<ChartComponents | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [connected, setConnected] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1s");
  const [symbol, setSymbol] = useState<string>("btcusdt");
  const [lastUpdate, setLastUpdate] = useState<string>("Waiting for data...");
  const dataMapRef = useRef(new Map<number, VolumeData>());

  // Initialize the chart
  useEffect(() => {
    if (chartContainerRef.current && !chartComponents.current) {
      try {
        console.log("Creating chart...");

        // Create chart
        const chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: "#121212" },
            textColor: "#e0e0e0",
          },
          grid: {
            vertLines: { color: "#303030" },
            horzLines: { color: "#303030" },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: "#333333",
          },
          width: chartContainerRef.current.clientWidth,
          height: window.innerHeight - 150,
        });

        console.log("Creating series...");

        // Using the correct v5 API approach
        const buySeries = chart.addSeries(HistogramSeries, {
          color: "rgba(0, 191, 255, 0.6)",
          priceFormat: {
            type: "volume",
          },
          priceScaleId: "left",
          base: 0,
        });

        const sellSeries = chart.addSeries(HistogramSeries, {
          color: "rgba(255, 50, 50, 0.6)",
          priceFormat: {
            type: "volume",
          },
          priceScaleId: "right",
          base: 0,
        });

        // Store references
        chartComponents.current = { chart, buySeries, sellSeries };

        // Handle resize
        const handleResize = () => {
          if (chartComponents.current && chartContainerRef.current) {
            chartComponents.current.chart.applyOptions({
              width: chartContainerRef.current.clientWidth,
              height: window.innerHeight - 150,
            });
          }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
      } catch (error) {
        console.error("Error initializing chart:", error);
      }
    }
  }, []);

  // Connect to Binance WebSocket and process orderbook data
  useEffect(() => {
    if (!chartComponents.current) return;

    // Close previous connection if it exists
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Reset data map for new connection
    dataMapRef.current = new Map<number, VolumeData>();

    // Initialize data structure for the current timeframe
    const timeFrameMs =
      TIMEFRAMES[selectedTimeframe as keyof typeof TIMEFRAMES] * 1000;

    // Create WebSocket connection to Binance
    const ws = new WebSocket(getDepthStreamUrl(symbol));
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to Binance WebSocket");
      setConnected(true);
      setLastUpdate("Connected to Binance WebSocket");
    };

    ws.onclose = () => {
      console.log("Disconnected from Binance WebSocket");
      setConnected(false);
      setLastUpdate("Disconnected from Binance WebSocket");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setLastUpdate(`WebSocket error: ${new Date().toLocaleTimeString()}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as BinanceDepthUpdate;

        // Process orderbook data
        if (data.b && data.a) {
          // Bids and asks
          // Get current timestamp and round it to the current timeframe
          const now = Date.now();
          const timeframeTimestamp =
            Math.floor(now / timeFrameMs) * timeFrameMs;

          // Process the depth data
          const { buyVolume, sellVolume } = processDepthData(data);

          // Update the data map
          const dataMap = dataMapRef.current;

          // If we have data for this timeframe already, update it
          if (dataMap.has(timeframeTimestamp)) {
            const existing = dataMap.get(timeframeTimestamp)!;
            dataMap.set(timeframeTimestamp, {
              time: timeframeTimestamp,
              buyVolume: existing.buyVolume + buyVolume,
              sellVolume: existing.sellVolume + sellVolume,
            });
          } else {
            // Otherwise create a new entry
            dataMap.set(timeframeTimestamp, {
              time: timeframeTimestamp,
              buyVolume,
              sellVolume,
            });
          }

          // Update state with the latest data
          const newData = Array.from(dataMap.values())
            .sort((a, b) => a.time - b.time)
            .slice(-100); // Keep last 100 bars for performance

          setVolumeData(newData);
          setLastUpdate(`Last update: ${formatTimestamp(now)}`);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbol, selectedTimeframe]);

  // Update chart with new data
  useEffect(() => {
    if (!chartComponents.current || volumeData.length === 0) return;

    try {
      console.log("Updating chart data...");

      const { buySeries, sellSeries } = chartComponents.current;

      // Format data for chart series
      const buyData = volumeData.map((item) => ({
        time: (item.time / 1000) as UTCTimestamp,
        value: item.buyVolume,
      }));

      const sellData = volumeData.map((item) => ({
        time: (item.time / 1000) as UTCTimestamp,
        value: item.sellVolume,
      }));

      // Update series data
      buySeries.setData(buyData);
      sellSeries.setData(sellData);

      // Fit content to view
      chartComponents.current.chart.timeScale().fitContent();
    } catch (error) {
      console.error("Error updating chart data:", error);
    }
  }, [volumeData]);

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <div className="flex items-center space-x-3">
          <label htmlFor="symbol-select" className="text-sm font-medium">
            Symbol:
          </label>
          <select
            id="symbol-select"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toLowerCase())}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
          >
            <option value="btcusdt">BTCUSDT</option>
            <option value="ethusdt">ETHUSDT</option>
            <option value="bnbusdt">BNBUSDT</option>
            <option value="solusdt">SOLUSDT</option>
            <option value="xrpusdt">XRPUSDT</option>
            <option value="dogeusdt">DOGEUSDT</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <label htmlFor="timeframe-select" className="text-sm font-medium">
            Timeframe:
          </label>
          <select
            id="timeframe-select"
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
          >
            {Object.keys(TIMEFRAMES).map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm">
          <span
            className={`inline-block w-3 h-3 rounded-full mr-1 ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
          {lastUpdate}
        </div>
      </div>

      <div className="text-sm mb-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-blue-400 rounded-full mr-1"></span>
            <span>Buy Volume ({selectedTimeframe})</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
            <span>Sell Volume ({selectedTimeframe})</span>
          </div>
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className="w-full h-[calc(100vh-150px)] bg-gray-900 rounded-md shadow-sm border border-gray-700"
      />

      {volumeData.length > 0 && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 flex flex-col md:flex-row md:justify-between">
          <div>
            Latest data (
            {formatTimestamp(volumeData[volumeData.length - 1].time)})
          </div>
          <div>
            Buy Volume:{" "}
            {formatVolume(volumeData[volumeData.length - 1].buyVolume)} | Sell
            Volume: {formatVolume(volumeData[volumeData.length - 1].sellVolume)}
          </div>
        </div>
      )}
    </div>
  );
}
