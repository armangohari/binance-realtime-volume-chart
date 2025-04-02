"use client";

import {
  BinanceDepthUpdate,
  VolumeData,
  createBinanceWebSocket,
  formatTimestamp,
  formatVolume,
  processDepthData,
} from "@/utils/binanceUtils";
import {
  ColorType,
  HistogramSeries,
  ISeriesApi,
  UTCTimestamp,
  createChart,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import {
  COMMON_BINANCE_PAIRS,
  TIMEFRAMES,
  formatPairName,
} from "@/constants/binancePairs";
import { TradingViewPriceChart } from "./TradingViewPriceChart";

// Define interfaces for our chart references
interface TotalVolumeChart {
  chart: ReturnType<typeof createChart>;
  series: ISeriesApi<"Histogram">;
}

interface PressureChart {
  chart: ReturnType<typeof createChart>;
  series: ISeriesApi<"Histogram">;
}

interface BinanceVolumeChartProps {
  symbol?: string;
  timeframe?: string;
  onSymbolChange?: (symbol: string) => void;
  onTimeframeChange?: (timeframe: string) => void;
  showPriceChart?: boolean;
}

export default function BinanceVolumeChart({
  symbol: externalSymbol = "btcusdt",
  timeframe: externalTimeframe = "1m",
  onSymbolChange,
  onTimeframeChange,
  showPriceChart = false,
}: BinanceVolumeChartProps) {
  const totalVolumeChartRef = useRef<HTMLDivElement>(null);
  const pressureChartRef = useRef<HTMLDivElement>(null);
  const totalVolumeChartComponents = useRef<TotalVolumeChart | null>(null);
  const pressureChartComponents = useRef<PressureChart | null>(null);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(externalSymbol);
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<string>(externalTimeframe);
  const [lastUpdate, setLastUpdate] = useState<string>("Loading data...");
  const [loading, setLoading] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const currentTimeframeRef = useRef<string>(externalTimeframe);
  const dataMapRef = useRef(new Map<number, VolumeData>());
  const wsRef = useRef<WebSocket | null>(null);
  const [reconnectCount, setReconnectCount] = useState<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Update internal state when props change
  useEffect(() => {
    if (externalSymbol !== selectedSymbol) {
      setSelectedSymbol(externalSymbol);
    }
    if (externalTimeframe !== selectedTimeframe) {
      setSelectedTimeframe(externalTimeframe);
      currentTimeframeRef.current = externalTimeframe;
    }
  }, [externalSymbol, externalTimeframe, selectedSymbol, selectedTimeframe]);

  // Function to handle symbol change
  const handleSymbolChange = (newSymbol: string) => {
    setSelectedSymbol(newSymbol);
    if (onSymbolChange) {
      onSymbolChange(newSymbol);
    }
  };

  // Function to handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    setSelectedTimeframe(newTimeframe);
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  };

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
  const cardBgColor = "bg-[#0f1217]";
  const borderColor = "border-[#252830]";
  const controlBgColor = "bg-[#161b24]";
  const controlBorderColor = "border-[#252a36]";

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
        // For v5.0.3, use addSeries with HistogramSeries
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
      dataMapRef.current = new Map<number, VolumeData>();

      try {
        // Create a new WebSocket connection using our safer method
        const newWs = createBinanceWebSocket(
          selectedSymbol,
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
            try {
              const data = JSON.parse(event.data) as BinanceDepthUpdate;

              // Process orderbook data
              if (data.b && data.a) {
                // Bids and asks
                // Get current timestamp and round it to the current timeframe
                const now = Date.now();
                // Use the ref to access the current timeframe value
                const currentTimeFrameMs =
                  TIMEFRAMES[
                    currentTimeframeRef.current as keyof typeof TIMEFRAMES
                  ] * 1000;
                const timeframeTimestamp =
                  Math.floor(now / currentTimeFrameMs) * currentTimeFrameMs;

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
    if (
      !isMountedRef.current ||
      !totalVolumeChartComponents.current ||
      !pressureChartComponents.current
    )
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
          console.log(
            `Closing existing WebSocket connection for ${selectedSymbol}...`,
          );
          ws.close(1000, "Symbol or timeframe changed");
        }
      } catch (err) {
        console.error("Error closing WebSocket:", err);
      }
    }

    // Reset data map for new connection
    dataMapRef.current = new Map<number, VolumeData>();

    // Clear existing volume data when symbol or timeframe changes
    setVolumeData([]);
    setLoading(true);

    console.log(
      `Symbol changed to ${selectedSymbol} with timeframe ${selectedTimeframe}, reset data and reconnecting...`,
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
        const ws = createBinanceWebSocket(
          selectedSymbol,
          // onOpen
          () => {
            if (!isMountedRef.current) return;

            console.log("Connected to Binance WebSocket");
            setConnected(true);
            setLastUpdate("Connected to Binance WebSocket");
            setReconnectCount(0); // Reset reconnect count on successful connection
          },
          // onClose
          (event) => {
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
            if (!isMountedRef.current) return;

            console.error("WebSocket error:", error);
            setLastUpdate(
              `WebSocket error: ${new Date().toLocaleTimeString()}`,
            );
            // Error will trigger the onclose handler which will handle reconnection
          },
          // onMessage
          (event) => {
            if (!isMountedRef.current) return;

            try {
              const data = JSON.parse(event.data) as BinanceDepthUpdate;

              // Process orderbook data
              if (data.b && data.a) {
                // Bids and asks
                // Get current timestamp and round it to the current timeframe
                const now = Date.now();
                // Use the ref to access the current timeframe value
                const currentTimeFrameMs =
                  TIMEFRAMES[
                    currentTimeframeRef.current as keyof typeof TIMEFRAMES
                  ] * 1000;
                const timeframeTimestamp =
                  Math.floor(now / currentTimeFrameMs) * currentTimeFrameMs;

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
  }, [selectedSymbol, selectedTimeframe]);

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

  return (
    <div className="flex w-full flex-col">
      {/* Header and Description (only if not in a container) */}
      <div className="mb-3 md:mb-5">
        <h1 className="mb-1 text-lg font-bold md:text-xl">
          Binance Orderbook Volume Analysis
        </h1>
        <p className="text-xs text-slate-400 md:text-sm">
          Real-time orderbook depth visualization
        </p>
      </div>

      {/* Controls Section */}
      <div
        className={`${cardBgColor} mb-3 rounded-xl p-2 shadow-lg md:mb-5 md:p-4 ${borderColor} border`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Trading Pair Selector */}
            <div>
              <label
                htmlFor="symbol-select"
                className="mb-1 block text-xs font-medium text-slate-300 md:text-sm"
              >
                Trading Pair
              </label>
              <div className="relative inline-block">
                <select
                  id="symbol-select"
                  value={selectedSymbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  className={`${controlBgColor} ${controlBorderColor} w-28 appearance-none rounded-md border px-3 py-2 pr-8 text-sm font-medium uppercase text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-36 md:text-base`}
                  disabled={loading && !connected}
                >
                  {COMMON_BINANCE_PAIRS.map((pair) => (
                    <option key={pair} value={pair}>
                      {formatPairName(pair)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-0 top-0 flex h-full items-center pr-2 text-slate-400">
                  <svg
                    className="h-4 w-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div>
              <label
                htmlFor="timeframe-select"
                className="mb-1 block text-xs font-medium text-slate-300 md:text-sm"
              >
                Timeframe
              </label>
              <div className="relative inline-block">
                <select
                  id="timeframe-select"
                  value={selectedTimeframe}
                  onChange={(e) => handleTimeframeChange(e.target.value)}
                  className={`${controlBgColor} ${controlBorderColor} w-24 appearance-none rounded-md border px-3 py-2 pr-8 text-sm font-medium text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-28 md:text-base`}
                  disabled={loading && !connected}
                >
                  {Object.keys(TIMEFRAMES).map((tf) => (
                    <option key={tf} value={tf}>
                      {tf}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-0 top-0 flex h-full items-center pr-2 text-slate-400">
                  <svg
                    className="h-4 w-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`rounded-lg px-2 py-1.5 md:px-4 md:py-2.5 ${
              connected
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-blue-500/20 text-blue-300"
            } border ${
              connected ? "border-emerald-600/30" : "border-blue-600/30"
            } flex items-center`}
          >
            <span
              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full md:mr-2 md:h-2 md:w-2 ${
                connected ? "bg-emerald-400" : "bg-blue-400"
              } animate-pulse`}
            ></span>
            <span className="text-xs font-medium md:text-sm">{lastUpdate}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mb-3 grid grid-cols-1 gap-3 md:mb-5 md:gap-5">
        {/* Optional TradingView Price Chart */}
        {showPriceChart && (
          <TradingViewPriceChart
            symbol={selectedSymbol}
            timeframe={selectedTimeframe}
            hideHeader={false}
          />
        )}

        {/* Total Volume Chart */}
        <div
          className={`${cardBgColor} rounded-xl p-2 shadow-lg md:p-4 ${borderColor} border`}
        >
          <div className="mb-2 flex items-center justify-between md:mb-2.5">
            <div className="flex items-center">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#dcdef0] opacity-60 md:h-2.5 md:w-2.5"></span>
              <span className="text-sm font-medium text-slate-200 md:text-base">
                Total Volume ({selectedTimeframe})
              </span>
            </div>
            {volumeData.length > 0 && (
              <div className="text-xs font-semibold text-blue-400 md:text-sm">
                {formatVolume(
                  volumeData[volumeData.length - 1].buyVolume +
                    volumeData[volumeData.length - 1].sellVolume,
                )}
              </div>
            )}
          </div>
          <div
            ref={totalVolumeChartRef}
            className="h-[200px] w-full overflow-hidden rounded-md md:h-[calc((100vh-280px)/2)]"
          />
        </div>

        {/* Pressure Chart */}
        <div
          className={`${cardBgColor} rounded-xl p-2 shadow-lg md:p-4 ${borderColor} border`}
        >
          <div className="mb-2 flex items-center justify-between md:mb-2.5">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="flex items-center">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#0190FF] md:mr-2 md:h-2.5 md:w-2.5"></span>
                <span className="text-sm font-medium text-slate-200 md:text-base">
                  Buy Dominant
                </span>
              </div>
              <div className="flex items-center">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#FF3B69] md:mr-2 md:h-2.5 md:w-2.5"></span>
                <span className="text-sm font-medium text-slate-200 md:text-base">
                  Sell Dominant
                </span>
              </div>
            </div>
            {volumeData.length > 0 && (
              <div className="text-xs font-semibold md:text-sm">
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
            className="h-[200px] w-full overflow-hidden rounded-md md:h-[calc((100vh-280px)/2)]"
          />
        </div>
      </div>

      {/* Footer Stats Section */}
      {volumeData.length > 0 && (
        <div
          className={`${cardBgColor} rounded-lg p-2 md:p-3.5 ${borderColor} border text-xs text-slate-300 md:text-sm`}
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3">
            <div className="flex items-center">
              <svg
                className="mr-2 h-3 w-3 text-slate-400 md:h-4 md:w-4"
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
                <div className="text-sm font-medium text-[#0190FF] md:text-base">
                  {formatVolume(volumeData[volumeData.length - 1].buyVolume)}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <svg
                className="mr-2 h-3 w-3 text-slate-400 md:h-4 md:w-4"
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
                <div className="text-sm font-medium text-[#FF3B69] md:text-base">
                  {formatVolume(volumeData[volumeData.length - 1].sellVolume)}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <svg
                className="mr-2 h-3 w-3 text-slate-400 md:h-4 md:w-4"
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
                  className={`text-sm font-medium md:text-base ${
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
