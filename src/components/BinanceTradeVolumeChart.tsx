"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  UTCTimestamp,
  HistogramSeries,
  ISeriesApi,
} from "lightweight-charts";
import {
  TradeVolumeData,
  formatTimestamp,
  formatVolume,
  createBinanceTradeWebSocket,
  processTradeData,
  BinanceTrade,
} from "../utils/tradeUtils";

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
interface TotalVolumeChart {
  chart: ReturnType<typeof createChart>;
  series: ISeriesApi<"Histogram">;
}

interface PressureChart {
  chart: ReturnType<typeof createChart>;
  series: ISeriesApi<"Histogram">;
}

export default function BinanceTradeVolumeChart() {
  const totalVolumeChartRef = useRef<HTMLDivElement>(null);
  const pressureChartRef = useRef<HTMLDivElement>(null);
  const totalVolumeChartComponents = useRef<TotalVolumeChart | null>(null);
  const pressureChartComponents = useRef<PressureChart | null>(null);
  const [volumeData, setVolumeData] = useState<TradeVolumeData[]>([]);
  const [symbol, setSymbol] = useState<string>("btcusdt");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1m");
  const [lastUpdate, setLastUpdate] = useState<string>("Loading data...");
  const [loading, setLoading] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const currentTimeframeRef = useRef<string>("1m");
  const dataMapRef = useRef(new Map<number, TradeVolumeData>());
  const wsRef = useRef<WebSocket | null>(null);
  const [reconnectCount, setReconnectCount] = useState<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Create the chart theme
  const getChartTheme = () => {
    return {
      background: "#0f1217",
      text: "#c7c7c7",
      grid: "#1a1d25",
      border: "#2a2e39",
    };
  };

  // Constants for styling
  const bgColor = "bg-[#060a10]";
  const cardBgColor = "bg-[#0f1217]";
  const borderColor = "border-[#252830]";
  const controlBgColor = "bg-[#161b24]";
  const controlBorderColor = "border-[#252a36]";

  // Set up mounted ref for component lifecycle tracking
  useEffect(() => {
    // Set mounted flag to true
    isMountedRef.current = true;

    // Clean up on unmount
    return () => {
      // Set mounted flag to false to prevent state updates after unmounting
      isMountedRef.current = false;

      // Clear any reconnect timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close WebSocket if open
      if (wsRef.current) {
        console.log("Closing WebSocket due to component unmount");
        try {
          if (
            wsRef.current.readyState !== 3 &&
            wsRef.current.readyState !== 2
          ) {
            wsRef.current.close(1000, "Component unmounted");
          }
        } catch (err) {
          console.error("Error closing WebSocket on unmount:", err);
        }
        wsRef.current = null;
      }
    };
  }, []);

  // Initialize charts
  useEffect(() => {
    if (
      totalVolumeChartRef.current &&
      pressureChartRef.current &&
      !totalVolumeChartComponents.current &&
      !pressureChartComponents.current
    ) {
      try {
        console.log("Creating charts...");
        const chartTheme = getChartTheme();

        // Create total volume chart
        const totalVolumeChart = createChart(totalVolumeChartRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: chartTheme.background },
            textColor: chartTheme.text,
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          },
          grid: {
            vertLines: { color: chartTheme.grid },
            horzLines: { color: chartTheme.grid },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: chartTheme.border,
            barSpacing: 8,
          },
          rightPriceScale: {
            visible: true,
            borderColor: chartTheme.border,
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          },
          leftPriceScale: {
            visible: false,
          },
          width: totalVolumeChartRef.current.clientWidth,
          height: (window.innerHeight - 280) / 2,
          crosshair: {
            vertLine: {
              color: "rgba(255, 255, 255, 0.2)",
              width: 1,
              style: 1,
              labelBackgroundColor: "#2962FF",
            },
            horzLine: {
              color: "rgba(255, 255, 255, 0.2)",
              width: 1,
              style: 1,
              labelBackgroundColor: "#2962FF",
            },
            mode: 1,
          },
        });

        // Total volume series - Light white
        const totalVolumeSeries = totalVolumeChart.addSeries(HistogramSeries, {
          color: "rgba(220, 220, 240, 0.65)",
          priceFormat: {
            type: "volume",
            precision: 0,
            minMove: 0.01,
          },
          priceScaleId: "right",
        });

        totalVolumeChartComponents.current = {
          chart: totalVolumeChart,
          series: totalVolumeSeries,
        };

        // Create pressure chart
        const pressureChart = createChart(pressureChartRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: chartTheme.background },
            textColor: chartTheme.text,
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          },
          grid: {
            vertLines: { color: chartTheme.grid },
            horzLines: { color: chartTheme.grid },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: chartTheme.border,
            barSpacing: 8,
          },
          rightPriceScale: {
            visible: true,
            borderColor: chartTheme.border,
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          },
          leftPriceScale: {
            visible: false,
          },
          width: pressureChartRef.current.clientWidth,
          height: (window.innerHeight - 280) / 2,
          crosshair: {
            vertLine: {
              color: "rgba(255, 255, 255, 0.2)",
              width: 1,
              style: 1,
              labelBackgroundColor: "#2962FF",
            },
            horzLine: {
              color: "rgba(255, 255, 255, 0.2)",
              width: 1,
              style: 1,
              labelBackgroundColor: "#2962FF",
            },
            mode: 1,
          },
        });

        // Pressure series with dynamic colors
        const pressureSeries = pressureChart.addSeries(HistogramSeries, {
          color: "rgba(0, 0, 0, 0)", // Will be set dynamically
          priceFormat: {
            type: "volume",
            precision: 0,
            minMove: 0.01,
          },
          priceScaleId: "right",
        });

        pressureChartComponents.current = {
          chart: pressureChart,
          series: pressureSeries,
        };

        // Handle resize
        const handleResize = () => {
          if (
            totalVolumeChartComponents.current &&
            totalVolumeChartRef.current
          ) {
            totalVolumeChartComponents.current.chart.applyOptions({
              width: totalVolumeChartRef.current.clientWidth,
              height: (window.innerHeight - 280) / 2,
            });
          }

          if (pressureChartComponents.current && pressureChartRef.current) {
            pressureChartComponents.current.chart.applyOptions({
              width: pressureChartRef.current.clientWidth,
              height: (window.innerHeight - 280) / 2,
            });
          }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
      } catch (error) {
        console.error("Error initializing charts:", error);
      }
    }
  }, []);

  // Define reconnect function with the latest timeframe from closure
  const reconnectWithCurrentTimeframe = () => {
    // Don't reconnect if component is unmounted
    if (!isMountedRef.current) {
      console.log("Component unmounted, skipping reconnect");
      return;
    }

    // Calculate backoff time, starting from 1 second and increasing exponentially
    // Capped at 30 seconds
    const backoffTime = Math.min(1000 * Math.pow(1.5, reconnectCount), 30000);
    console.log(
      `Scheduling reconnect attempt in ${backoffTime}ms (attempt #${
        reconnectCount + 1
      })`,
    );

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close any existing WebSocket
    if (wsRef.current) {
      try {
        // Only close if readyState is not already CLOSED or CLOSING
        if (wsRef.current.readyState !== 3 && wsRef.current.readyState !== 2) {
          console.log("Closing existing WebSocket before reconnect...");
          const ws = wsRef.current;
          wsRef.current = null;
          ws.close(1000, "Reconnecting");
        } else {
          wsRef.current = null;
        }
      } catch (err) {
        console.error("Error closing WebSocket during reconnect:", err);
        wsRef.current = null;
      }
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      // Check if component is still mounted before continuing
      if (!isMountedRef.current) {
        console.log("Component unmounted during reconnect timeout");
        return;
      }

      setReconnectCount((prev) => prev + 1);
      setLastUpdate(`Reconnecting (attempt ${reconnectCount + 1})...`);

      // Reset data map on reconnection
      dataMapRef.current = new Map<number, TradeVolumeData>();

      try {
        // Create a new WebSocket connection using our safer method
        const newWs = createBinanceTradeWebSocket(
          symbol,
          // onOpen
          () => {
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) return;

            console.log("Connected to Binance WebSocket");
            setConnected(true);
            setLastUpdate("Connected to Binance WebSocket");
            setReconnectCount(0); // Reset reconnect count on successful connection
          },
          // onClose
          (event) => {
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) return;

            console.log("Disconnected from Binance WebSocket", event);
            setConnected(false);
            setLastUpdate(
              `Disconnected from Binance WebSocket: ${
                event.reason || "Unknown reason"
              }`,
            );

            // Only attempt to reconnect if this wasn't a normal closure
            if (event.code !== 1000 && isMountedRef.current) {
              reconnectWithCurrentTimeframe();
            }
          },
          // onError
          (error) => {
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) return;

            console.error("WebSocket error:", error);
            setLastUpdate(
              `WebSocket error: ${new Date().toLocaleTimeString()}`,
            );
            // Allow the close handler to handle reconnection
          },
          // onMessage
          (event) => {
            // Check if component is still mounted before processing data
            if (!isMountedRef.current) return;

            try {
              const data = JSON.parse(event.data) as BinanceTrade;

              // Get current timestamp and round it to the current timeframe
              const now = Date.now();
              // Use the ref to access the current timeframe value
              const currentTimeFrameMs =
                TIMEFRAMES[
                  currentTimeframeRef.current as keyof typeof TIMEFRAMES
                ] * 1000;
              const timeframeTimestamp =
                Math.floor(now / currentTimeFrameMs) * currentTimeFrameMs;

              // Process the trade data
              const { buyVolume, sellVolume } = processTradeData(data);

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

              console.log(
                `WebSocket data processed: ${newData.length} bars, buy: ${buyVolume}, sell: ${sellVolume}`,
              );
              setVolumeData(newData);
              setLastUpdate(
                `Last update: ${formatTimestamp(now)} (${
                  currentTimeframeRef.current
                })`,
              );
            } catch (error) {
              console.error("Error processing WebSocket message:", error);
            }
          },
        );
        wsRef.current = newWs;
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        // Try again after the backoff period
        reconnectWithCurrentTimeframe();
      }
    }, backoffTime);
  };

  // Connect to Binance WebSocket on component mount or when symbol/timeframe changes
  useEffect(() => {
    if (!totalVolumeChartComponents.current || !pressureChartComponents.current)
      return;

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close existing WS connection properly
    if (wsRef.current) {
      // Use a local variable to avoid race conditions
      const ws = wsRef.current;
      // Set to null first to prevent multiple closes
      wsRef.current = null;

      try {
        // Only close if readyState is not already CLOSED (3) or CLOSING (2)
        if (ws.readyState !== 3 && ws.readyState !== 2) {
          console.log(`Closing existing WebSocket connection for ${symbol}...`);
          ws.close(1000, "Timeframe changed");
        }
      } catch (err) {
        console.error("Error closing WebSocket:", err);
      }
    }

    // Reset data map for new connection
    dataMapRef.current = new Map<number, TradeVolumeData>();

    // Clear existing volume data when timeframe changes
    setVolumeData([]);

    console.log(
      `Timeframe changed to ${selectedTimeframe}, reset data and reconnecting...`,
    );

    // Add a small delay before reconnecting to ensure proper cleanup
    const timeoutId = setTimeout(() => {
      // Check if component is still mounted before creating WebSocket
      if (!isMountedRef.current) {
        console.log("Component unmounted, skipping WebSocket creation");
        return;
      }

      try {
        // Create WebSocket connection using the safer method
        const ws = createBinanceTradeWebSocket(
          symbol,
          // onOpen
          () => {
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) return;

            console.log("Connected to Binance WebSocket");
            setConnected(true);
            setLastUpdate("Connected to Binance WebSocket");
            setReconnectCount(0); // Reset reconnect count on successful connection
          },
          // onClose
          (event) => {
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) return;

            console.log("Disconnected from Binance WebSocket", event);
            setConnected(false);
            setLastUpdate(
              `Disconnected from Binance WebSocket: ${
                event.reason || "Unknown reason"
              }`,
            );

            // Only attempt to reconnect if this wasn't a normal closure
            if (event.code !== 1000 && isMountedRef.current) {
              reconnectWithCurrentTimeframe();
            }
          },
          // onError
          (error) => {
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) return;

            console.error("WebSocket error:", error);
            setLastUpdate(
              `WebSocket error: ${new Date().toLocaleTimeString()}`,
            );
            // Error will trigger the onclose handler which will handle reconnection
          },
          // onMessage
          (event) => {
            // Check if component is still mounted before processing data
            if (!isMountedRef.current) return;

            try {
              const data = JSON.parse(event.data) as BinanceTrade;

              // Get current timestamp and round it to the current timeframe
              const now = Date.now();
              // Use the ref to access the current timeframe value
              const currentTimeFrameMs =
                TIMEFRAMES[
                  currentTimeframeRef.current as keyof typeof TIMEFRAMES
                ] * 1000;
              const timeframeTimestamp =
                Math.floor(now / currentTimeFrameMs) * currentTimeFrameMs;

              // Process the trade data
              const { buyVolume, sellVolume } = processTradeData(data);

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
              if (isMountedRef.current) {
                const newData = Array.from(dataMap.values())
                  .sort((a, b) => a.time - b.time)
                  .slice(-100); // Keep last 100 bars for performance

                console.log(
                  `WebSocket data processed: ${newData.length} bars, buy: ${buyVolume}, sell: ${sellVolume}`,
                );
                setVolumeData(newData);
                setLastUpdate(
                  `Last update: ${formatTimestamp(now)} (${
                    currentTimeframeRef.current
                  })`,
                );

                // Set loading to false once we have data
                if (loading && newData.length > 0) {
                  setLoading(false);
                }
              }
            } catch (error) {
              console.error("Error processing WebSocket message:", error);
            }
          },
        );
        if (isMountedRef.current) {
          wsRef.current = ws;
        } else {
          // If component unmounted during WebSocket creation, close it immediately
          ws.close(1000, "Component unmounted");
        }
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        // Try to reconnect only if component is still mounted
        if (isMountedRef.current) {
          reconnectWithCurrentTimeframe();
        }
      }
    }, 100); // Small delay to ensure proper cleanup

    return () => {
      // Clear the timeout on cleanup
      clearTimeout(timeoutId);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        try {
          if (
            wsRef.current.readyState !== 3 &&
            wsRef.current.readyState !== 2
          ) {
            wsRef.current.close(1000, "Effect cleanup");
          }
        } catch (error) {
          console.error("Error closing WebSocket in cleanup:", error);
        }
        wsRef.current = null;
      }
    };
  }, [symbol, selectedTimeframe]);

  // Update the ref whenever selectedTimeframe changes
  useEffect(() => {
    currentTimeframeRef.current = selectedTimeframe;
    console.log(
      `Updated currentTimeframeRef to: ${currentTimeframeRef.current}`,
    );
  }, [selectedTimeframe]);

  // Update charts with new data
  useEffect(() => {
    if (
      !totalVolumeChartComponents.current ||
      !pressureChartComponents.current ||
      volumeData.length === 0
    )
      return;

    try {
      console.log("Updating chart data with", volumeData.length, "bars");

      // Format data for total volume series (buy + sell)
      const totalVolumeData = volumeData.map((item) => ({
        time: (item.time / 1000) as UTCTimestamp,
        value: item.buyVolume + item.sellVolume,
        color: "rgba(220, 220, 240, 0.65)",
      }));

      // Format data for pressure series with dynamic colors
      const pressureData = volumeData.map((item) => {
        const netPressure = Math.abs(item.buyVolume - item.sellVolume);
        const isBuyDominant = item.buyVolume > item.sellVolume;

        return {
          time: (item.time / 1000) as UTCTimestamp,
          value: netPressure,
          color: isBuyDominant
            ? "rgba(0, 191, 255, 0.8)"
            : "rgba(255, 50, 50, 0.8)",
        };
      });

      // Use try-catch for each chart update in case one fails
      try {
        // Update total volume series
        if (
          totalVolumeChartComponents.current.series &&
          totalVolumeData.length > 0
        ) {
          totalVolumeChartComponents.current.series.setData(totalVolumeData);
          totalVolumeChartComponents.current.chart.timeScale().fitContent();
        }
      } catch (err) {
        console.error("Error updating total volume chart:", err);
      }

      try {
        // Update pressure series
        if (pressureChartComponents.current.series && pressureData.length > 0) {
          pressureChartComponents.current.series.setData(pressureData);
          pressureChartComponents.current.chart.timeScale().fitContent();
        }
      } catch (err) {
        console.error("Error updating pressure chart:", err);
      }
    } catch (error) {
      console.error("Error updating chart data:", error);
    }
  }, [volumeData]);

  return (
    <div
      className={`flex w-full flex-col ${bgColor} min-h-screen p-5 text-slate-100`}
    >
      {/* Header Section */}
      <div className="mb-5">
        <h1 className="mb-1.5 text-xl font-bold">
          Binance Trade Volume Analysis
        </h1>
        <p className="text-sm text-slate-400">
          Real-time trade volume visualization (actual executed trades)
        </p>
      </div>

      {/* Controls Section */}
      <div
        className={`${cardBgColor} mb-5 rounded-xl p-4 shadow-lg ${borderColor} border`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label
                htmlFor="symbol-select"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Trading Pair
              </label>
              <select
                id="symbol-select"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toLowerCase())}
                className={`${controlBgColor} ${controlBorderColor} w-32 rounded-md border px-3 py-2 text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={loading}
              >
                <option value="btcusdt">BTC/USDT</option>
                <option value="ethusdt">ETH/USDT</option>
                <option value="bnbusdt">BNB/USDT</option>
                <option value="solusdt">SOL/USDT</option>
                <option value="xrpusdt">XRP/USDT</option>
                <option value="dogeusdt">DOGE/USDT</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="timeframe-select"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Timeframe
              </label>
              <select
                id="timeframe-select"
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className={`${controlBgColor} ${controlBorderColor} w-28 rounded-md border px-3 py-2 text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={loading}
              >
                {Object.keys(TIMEFRAMES).map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`rounded-lg px-4 py-2.5 ${
              connected
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-blue-500/20 text-blue-300"
            } border ${
              connected ? "border-emerald-600/30" : "border-blue-600/30"
            } flex items-center`}
          >
            <span
              className={`mr-2 inline-block h-2 w-2 rounded-full ${
                connected ? "bg-emerald-400" : "bg-blue-400"
              } animate-pulse`}
            ></span>
            <span className="text-sm font-medium">{lastUpdate}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mb-5 grid grid-cols-1 gap-5">
        {/* Total Volume Chart */}
        <div
          className={`${cardBgColor} rounded-xl p-4 shadow-lg ${borderColor} border`}
        >
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#dcdef0] opacity-60"></span>
              <span className="font-medium text-slate-200">
                Total Trade Volume ({selectedTimeframe})
              </span>
            </div>
            {volumeData.length > 0 && (
              <div className="text-sm font-semibold text-blue-400">
                {formatVolume(
                  volumeData[volumeData.length - 1].buyVolume +
                    volumeData[volumeData.length - 1].sellVolume,
                )}
              </div>
            )}
          </div>
          <div
            ref={totalVolumeChartRef}
            className="h-[calc((100vh-260px)/2)] w-full overflow-hidden rounded-md"
          />
        </div>

        {/* Pressure Chart */}
        <div
          className={`${cardBgColor} rounded-xl p-4 shadow-lg ${borderColor} border`}
        >
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#0190FF]"></span>
                <span className="font-medium text-slate-200">Buy Dominant</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#FF3B69]"></span>
                <span className="font-medium text-slate-200">
                  Sell Dominant
                </span>
              </div>
            </div>
            {volumeData.length > 0 && (
              <div className="text-sm font-semibold">
                <span
                  className={
                    volumeData[volumeData.length - 1].buyVolume >
                    volumeData[volumeData.length - 1].sellVolume
                      ? "text-[#0190FF]"
                      : "text-[#FF3B69]"
                  }
                >
                  {formatVolume(
                    Math.abs(
                      volumeData[volumeData.length - 1].buyVolume -
                        volumeData[volumeData.length - 1].sellVolume,
                    ),
                  )}
                </span>
              </div>
            )}
          </div>
          <div
            ref={pressureChartRef}
            className="h-[calc((100vh-260px)/2)] w-full overflow-hidden rounded-md"
          />
        </div>
      </div>

      {/* Footer Stats */}
      {volumeData.length > 0 && (
        <div
          className={`${cardBgColor} rounded-lg p-3.5 ${borderColor} border text-sm text-slate-300`}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="flex items-center">
              <svg
                className="mr-2.5 h-4 w-4 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20V10"></path>
                <path d="M18 20V4"></path>
                <path d="M6 20v-6"></path>
              </svg>
              <div>
                <div className="text-xs text-slate-400">Buy Volume</div>
                <div className="font-medium text-[#0190FF]">
                  {formatVolume(volumeData[volumeData.length - 1].buyVolume)}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <svg
                className="mr-2.5 h-4 w-4 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 4v10"></path>
                <path d="M18 4v16"></path>
                <path d="M6 4v6"></path>
              </svg>
              <div>
                <div className="text-xs text-slate-400">Sell Volume</div>
                <div className="font-medium text-[#FF3B69]">
                  {formatVolume(volumeData[volumeData.length - 1].sellVolume)}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <svg
                className="mr-2.5 h-4 w-4 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
              </svg>
              <div>
                <div className="text-xs text-slate-400">Net Pressure</div>
                <div
                  className={`font-medium ${
                    volumeData[volumeData.length - 1].buyVolume >
                    volumeData[volumeData.length - 1].sellVolume
                      ? "text-[#0190FF]"
                      : "text-[#FF3B69]"
                  }`}
                >
                  {formatVolume(
                    Math.abs(
                      volumeData[volumeData.length - 1].buyVolume -
                        volumeData[volumeData.length - 1].sellVolume,
                    ),
                  )}
                  <span className="ml-1 text-xs">
                    (
                    {volumeData[volumeData.length - 1].buyVolume >
                    volumeData[volumeData.length - 1].sellVolume
                      ? "Buy"
                      : "Sell"}
                    )
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
