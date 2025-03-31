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
  processDepthData,
  formatTimestamp,
  formatVolume,
  BinanceDepthUpdate,
  createBinanceWebSocket,
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
interface TotalVolumeChart {
  chart: ReturnType<typeof createChart>;
  series: ISeriesApi<"Histogram">;
}

interface PressureChart {
  chart: ReturnType<typeof createChart>;
  series: ISeriesApi<"Histogram">;
}

export default function BinanceVolumeChart() {
  const totalVolumeChartRef = useRef<HTMLDivElement>(null);
  const pressureChartRef = useRef<HTMLDivElement>(null);
  const totalVolumeChartComponents = useRef<TotalVolumeChart | null>(null);
  const pressureChartComponents = useRef<PressureChart | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [connected, setConnected] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1s");
  const [symbol, setSymbol] = useState<string>("btcusdt");
  const [lastUpdate, setLastUpdate] = useState<string>("Waiting for data...");
  const dataMapRef = useRef(new Map<number, VolumeData>());
  const [reconnectCount, setReconnectCount] = useState<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTimeframeRef = useRef<string>("1s");

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
          base: 0,
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
          base: 0,
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
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Increase backoff time with each attempt, but cap at 30 seconds
    const backoffTime = Math.min(Math.pow(2, reconnectCount) * 1000, 30000);

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectCount((prev) => prev + 1);
      setLastUpdate(`Reconnecting (attempt ${reconnectCount + 1})...`);

      // Close previous connection if it exists
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      console.log(
        `Reconnecting with timeframe: ${currentTimeframeRef.current}`
      );

      // Reset data map on reconnection
      dataMapRef.current = new Map<number, VolumeData>();

      try {
        // Create a new WebSocket connection using our safer method
        const newWs = createBinanceWebSocket(
          symbol,
          // onOpen
          () => {
            console.log("Connected to Binance WebSocket");
            setConnected(true);
            setLastUpdate("Connected to Binance WebSocket");
            setReconnectCount(0); // Reset reconnect count on successful connection
          },
          // onClose
          (event) => {
            console.log("Disconnected from Binance WebSocket", event);
            setConnected(false);
            setLastUpdate(
              `Disconnected from Binance WebSocket: ${
                event.reason || "Unknown reason"
              }`
            );

            // Only attempt to reconnect if this wasn't a normal closure
            if (event.code !== 1000) {
              reconnectWithCurrentTimeframe();
            }
          },
          // onError
          (error) => {
            console.error("WebSocket error:", error);
            setLastUpdate(
              `WebSocket error: ${new Date().toLocaleTimeString()}`
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
                  `WebSocket data processed with timeframe: ${currentTimeframeRef.current}, ${newData.length} bars`
                );
                setVolumeData(newData);
                setLastUpdate(
                  `Last update: ${formatTimestamp(now)} (${
                    currentTimeframeRef.current
                  })`
                );
              }
            } catch (error) {
              console.error("Error processing WebSocket message:", error);
            }
          }
        );
        wsRef.current = newWs;
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        // Try again after the backoff period
        reconnectWithCurrentTimeframe();
      }
    }, backoffTime);
  };

  // Connect to Binance WebSocket and process orderbook data
  useEffect(() => {
    if (!totalVolumeChartComponents.current || !pressureChartComponents.current)
      return;

    // Close previous connection if it exists
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Reset data map for new connection
    dataMapRef.current = new Map<number, VolumeData>();

    // Clear existing volume data when timeframe changes
    setVolumeData([]);

    console.log(
      `Timeframe changed to ${selectedTimeframe}, reset data and reconnecting...`
    );

    try {
      // Create WebSocket connection using the safer method
      const ws = createBinanceWebSocket(
        symbol,
        // onOpen
        () => {
          console.log("Connected to Binance WebSocket");
          setConnected(true);
          setLastUpdate("Connected to Binance WebSocket");
          setReconnectCount(0); // Reset reconnect count on successful connection
        },
        // onClose
        (event) => {
          console.log("Disconnected from Binance WebSocket", event);
          setConnected(false);
          setLastUpdate(
            `Disconnected from Binance WebSocket: ${
              event.reason || "Unknown reason"
            }`
          );

          // Only attempt to reconnect if this wasn't a normal closure
          if (event.code !== 1000) {
            reconnectWithCurrentTimeframe();
          }
        },
        // onError
        (error) => {
          console.error("WebSocket error:", error);
          setLastUpdate(`WebSocket error: ${new Date().toLocaleTimeString()}`);
          // Error will trigger the onclose handler which will handle reconnection
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
                `WebSocket data processed with timeframe: ${currentTimeframeRef.current}, ${newData.length} bars`
              );
              setVolumeData(newData);
              setLastUpdate(
                `Last update: ${formatTimestamp(now)} (${
                  currentTimeframeRef.current
                })`
              );
            }
          } catch (error) {
            console.error("Error processing WebSocket message:", error);
          }
        }
      );
      wsRef.current = ws;
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      // Try to reconnect
      reconnectWithCurrentTimeframe();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbol, selectedTimeframe]);

  // Update charts with new data
  useEffect(() => {
    if (
      !totalVolumeChartComponents.current ||
      !pressureChartComponents.current ||
      volumeData.length === 0
    )
      return;

    try {
      console.log("Updating chart data...");

      // Format data for total volume series (buy + sell)
      const totalVolumeData = volumeData.map((item) => ({
        time: (item.time / 1000) as UTCTimestamp,
        value: item.buyVolume + item.sellVolume,
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

      // Update series data
      totalVolumeChartComponents.current.series.setData(totalVolumeData);
      pressureChartComponents.current.series.setData(pressureData);

      // Fit content to view
      totalVolumeChartComponents.current.chart.timeScale().fitContent();
      pressureChartComponents.current.chart.timeScale().fitContent();
    } catch (error) {
      console.error("Error updating chart data:", error);
    }
  }, [volumeData]);

  // Update the ref whenever selectedTimeframe changes
  useEffect(() => {
    currentTimeframeRef.current = selectedTimeframe;
    console.log(
      `Updated currentTimeframeRef to: ${currentTimeframeRef.current}`
    );
  }, [selectedTimeframe]);

  return (
    <div
      className={`flex flex-col w-full ${bgColor} text-slate-100 min-h-screen p-5`}
    >
      {/* Header Section */}
      <div className="mb-5">
        <h1 className="text-xl font-bold mb-1.5">Binance Volume Analysis</h1>
        <p className="text-slate-400 text-sm">
          Real-time order book volume visualization
        </p>
      </div>

      {/* Controls Section */}
      <div
        className={`${cardBgColor} rounded-xl p-4 shadow-lg mb-5 ${borderColor} border`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label
                htmlFor="symbol-select"
                className="text-sm font-medium text-slate-300 block mb-1.5"
              >
                Trading Pair
              </label>
              <select
                id="symbol-select"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toLowerCase())}
                className={`${controlBgColor} ${controlBorderColor} border text-white rounded-md px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
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
                className="text-sm font-medium text-slate-300 block mb-1.5"
              >
                Timeframe
              </label>
              <select
                id="timeframe-select"
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className={`${controlBgColor} ${controlBorderColor} border text-white rounded-md px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
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
            className={`px-4 py-2.5 rounded-lg ${
              connected
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-red-500/20 text-red-300"
            } border ${
              connected ? "border-emerald-600/30" : "border-red-600/30"
            } flex items-center`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full mr-2 ${
                connected ? "bg-emerald-400" : "bg-red-400"
              } animate-pulse`}
            ></span>
            <span className="text-sm font-medium">{lastUpdate}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-5 mb-5">
        {/* Total Volume Chart */}
        <div
          className={`${cardBgColor} rounded-xl p-4 shadow-lg ${borderColor} border`}
        >
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center">
              <span className="inline-block w-2.5 h-2.5 bg-[#dcdef0] opacity-60 rounded-full mr-2"></span>
              <span className="font-medium text-slate-200">
                Total Volume ({selectedTimeframe})
              </span>
            </div>
            {volumeData.length > 0 && (
              <div className="text-sm font-semibold text-blue-400">
                {formatVolume(
                  volumeData[volumeData.length - 1].buyVolume +
                    volumeData[volumeData.length - 1].sellVolume
                )}
              </div>
            )}
          </div>
          <div
            ref={totalVolumeChartRef}
            className="w-full h-[calc((100vh-260px)/2)] rounded-md overflow-hidden"
          />
        </div>

        {/* Pressure Chart */}
        <div
          className={`${cardBgColor} rounded-xl p-4 shadow-lg ${borderColor} border`}
        >
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <span className="inline-block w-2.5 h-2.5 bg-[#0190FF] rounded-full mr-2"></span>
                <span className="font-medium text-slate-200">Buy Dominant</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-2.5 h-2.5 bg-[#FF3B69] rounded-full mr-2"></span>
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
                        volumeData[volumeData.length - 1].sellVolume
                    )
                  )}
                </span>
              </div>
            )}
          </div>
          <div
            ref={pressureChartRef}
            className="w-full h-[calc((100vh-260px)/2)] rounded-md overflow-hidden"
          />
        </div>
      </div>

      {/* Footer Stats */}
      {volumeData.length > 0 && (
        <div
          className={`${cardBgColor} rounded-lg p-3.5 ${borderColor} border text-sm text-slate-300`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-2.5 text-slate-400"
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
                className="w-4 h-4 mr-2.5 text-slate-400"
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
                className="w-4 h-4 mr-2.5 text-slate-400"
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
                        volumeData[volumeData.length - 1].sellVolume
                    )
                  )}
                  <span className="text-xs ml-1">
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
