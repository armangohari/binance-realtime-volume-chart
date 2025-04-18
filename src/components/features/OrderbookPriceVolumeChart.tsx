"use client";

import {
  COMMON_BINANCE_PAIRS,
  TIMEFRAMES,
  formatPairName,
} from "@/constants/binancePairs";
import {
  BinanceDepthUpdate,
  VolumeData,
  createBinanceWebSocket,
  formatTimestamp,
  formatVolume,
  processDepthData,
} from "@/utils/binanceUtils";
import {
  CandlestickData,
  CandlestickSeries,
  ColorType,
  HistogramData,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
  createChart,
} from "lightweight-charts";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import { IoStatsChart } from "react-icons/io5";
import { MdSwapVert } from "react-icons/md";

// Define interfaces for our chart references
interface ChartComponents {
  priceChart: IChartApi;
  pressureChart: IChartApi;
  totalVolumeChart: IChartApi;
  candleSeries: ISeriesApi<"Candlestick">;
  pressureSeries: ISeriesApi<"Histogram">;
  totalVolumeSeries: ISeriesApi<"Histogram">;
}

// Add interface for Kline WebSocket data
interface BinanceKlineUpdate {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  k: {
    t: number; // Kline start time
    T: number; // Kline close time
    s: string; // Symbol
    i: string; // Interval
    f: number; // First trade ID
    L: number; // Last trade ID
    o: string; // Open price
    c: string; // Close price
    h: string; // High price
    l: string; // Low price
    v: string; // Base asset volume
    n: number; // Number of trades
    x: boolean; // Is this kline closed?
    q: string; // Quote asset volume
    V: string; // Taker buy base asset volume
    Q: string; // Taker buy quote asset volume
    B: string; // Ignore
  };
}

export default function OrderbookPriceVolumeChart() {
  const priceChartRef = useRef<HTMLDivElement>(null);
  const pressureChartRef = useRef<HTMLDivElement>(null);
  const totalVolumeChartRef = useRef<HTMLDivElement>(null);
  const chartComponents = useRef<ChartComponents | null>(null);
  const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

  const { theme } = useTheme();
  const [selectedSymbol, setSelectedSymbol] = useState<string>("btcusdt");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1m");
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [klineData, setKlineData] = useState<CandlestickData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("Initializing...");
  const [loadingKlines, setLoadingKlines] = useState<boolean>(true);
  const [loadingWebsocket, setLoadingWebsocket] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const currentTimeframeRef = useRef<string>(selectedTimeframe);
  const dataMapRef = useRef(new Map<number, VolumeData>());
  const wsRef = useRef<WebSocket | null>(null);
  const [reconnectCount, setReconnectCount] = useState<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const [syncingCharts, setSyncingCharts] = useState<boolean>(false);
  // Add chartsReady state for visibility control
  const [chartsReady, setChartsReady] = useState<boolean>(false);

  const wsKlineRef = useRef<WebSocket | null>(null);
  const lastKlineRef = useRef<CandlestickData | null>(null);

  // Internal symbol/timeframe handlers
  const handleSymbolChange = (newSymbol: string) => {
    setSelectedSymbol(newSymbol.toLowerCase());
  };

  const handleTimeframeChange = (newTimeframe: string) => {
    setSelectedTimeframe(newTimeframe);
  };

  // Combined getChartTheme function
  const getChartTheme = (currentTheme: string | undefined) => {
    if (currentTheme === "light") {
      return {
        background: "#ffffff",
        text: "#333333",
        grid: "#e0e0e0",
        border: "#d1d1d1",
        candleUp: "#26a69a",
        candleDown: "#ef5350",
        volumeBuy: "rgba(38, 166, 154, 0.7)",
        volumeSell: "rgba(239, 83, 80, 0.7)",
        totalVolume: "rgba(120, 120, 120, 0.65)",
        crosshair: "rgba(51, 51, 51, 0.3)",
        crosshairLabelBg: "#f0f0f0",
        spinnerBorder: "border-gray-200",
        spinnerTop: "border-t-blue-500",
      };
    }
    // Default to dark theme
    return {
      background: "#0f1217",
      text: "#c7c7c7",
      grid: "#1a1d25",
      border: "#2a2e39",
      candleUp: "#26a69a",
      candleDown: "#ef5350",
      volumeBuy: "rgba(0, 191, 255, 0.8)",
      volumeSell: "rgba(255, 50, 50, 0.8)",
      totalVolume: "rgba(220, 220, 240, 0.65)",
      crosshair: "rgba(255, 255, 255, 0.2)",
      crosshairLabelBg: "#2962FF",
      spinnerBorder: "border-[#1a1d25]",
      spinnerTop: "border-t-[#dcdef0]",
    };
  };

  // Initialize charts (Combined and updated)
  useEffect(() => {
    if (
      priceChartRef.current &&
      pressureChartRef.current &&
      totalVolumeChartRef.current &&
      !chartComponents.current
    ) {
      // Set a timer to ensure DOM is fully rendered
      const initTimer = setTimeout(() => {
        try {
          console.log("Creating charts with forced size...");
          const chartTheme = getChartTheme(theme);

          // Force explicit size instead of relying on container size
          const containerWidth =
            priceChartRef.current?.parentElement?.clientWidth || 800;
          const windowHeight = window.innerHeight;
          const chartHeight = windowHeight - 280;

          // Common chart options
          const commonOptions = {
            layout: {
              background: {
                type: ColorType.Solid,
                color: chartTheme.background,
              },
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
            crosshair: {
              vertLine: {
                color: chartTheme.crosshair,
                width: 1 as 1,
                style: 1,
                labelBackgroundColor: chartTheme.crosshairLabelBg,
              },
              horzLine: {
                color: chartTheme.crosshair,
                width: 1 as 1,
                style: 1,
                labelBackgroundColor: chartTheme.crosshairLabelBg,
              },
              mode: 1,
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
          };

          // Make sure references are not null
          if (
            !priceChartRef.current ||
            !pressureChartRef.current ||
            !totalVolumeChartRef.current
          ) {
            console.error("Chart ref elements not available");
            return;
          }

          // Create price chart with explicit size
          const priceChart = createChart(priceChartRef.current, {
            ...commonOptions,
            width: containerWidth,
            height: chartHeight * 0.6,
          });

          // Create pressure volume chart with explicit size
          const pressureChart = createChart(pressureChartRef.current, {
            ...commonOptions,
            width: containerWidth,
            height: chartHeight * 0.2,
          });

          // Create total volume chart with explicit size
          const totalVolumeChart = createChart(totalVolumeChartRef.current, {
            ...commonOptions,
            width: containerWidth,
            height: chartHeight * 0.2,
          });

          // Candlestick series for price chart
          const candleSeries = priceChart.addSeries(CandlestickSeries, {
            upColor: chartTheme.candleUp,
            downColor: chartTheme.candleDown,
            borderVisible: false,
            wickUpColor: chartTheme.candleUp,
            wickDownColor: chartTheme.candleDown,
            priceFormat: {
              type: "price",
              precision: 2,
              minMove: 0.01,
            },
          });

          // Pressure volume series (Net Pressure)
          const pressureSeries = pressureChart.addSeries(HistogramSeries, {
            color: "rgba(0, 0, 0, 0)", // Will be set dynamically
            priceFormat: {
              type: "volume",
              precision: 0,
              minMove: 0.01,
            },
          });

          // Total volume series
          const totalVolumeSeries = totalVolumeChart.addSeries(
            HistogramSeries,
            {
              color: chartTheme.totalVolume,
              priceFormat: {
                type: "volume",
                precision: 0,
                minMove: 0.01,
              },
            },
          );

          chartComponents.current = {
            priceChart,
            pressureChart,
            totalVolumeChart,
            candleSeries,
            pressureSeries,
            totalVolumeSeries,
          };

          // Fixed synchronization logic
          const syncTimeScales = () => {
            if (syncingCharts) return;
            setSyncingCharts(true);

            try {
              const charts = [priceChart, pressureChart, totalVolumeChart];

              // Set up a single leader chart (price chart)
              const leaderChart = charts[0];
              const followerCharts = charts.slice(1);

              // Initial sync - only if there's data available
              // Skip initial sync - wait for data to be loaded instead
              // This prevents the "Value is null" errors

              // Subscribe to leader chart time scale changes
              leaderChart
                .timeScale()
                .subscribeVisibleTimeRangeChange((range) => {
                  if (syncingCharts || !range) return;

                  setSyncingCharts(true);
                  followerCharts.forEach((chart) => {
                    try {
                      chart.timeScale().setVisibleRange(range);
                    } catch (error) {
                      console.warn("Failed to sync time range:", error);
                    }
                  });
                  setTimeout(() => setSyncingCharts(false), 10);
                });

              // Fixed crosshair sync
              leaderChart.subscribeCrosshairMove((param) => {
                if (syncingCharts || !param.time) return;

                followerCharts.forEach((chart) => {
                  try {
                    // @ts-ignore - There appears to be a type mismatch in the lightweight-charts API
                    // This actually works at runtime despite the TypeScript error
                    chart.setCrosshairPosition(param.point?.x || 0, param.time);
                  } catch (error) {
                    console.warn("Failed to sync crosshair:", error);
                  }
                });
              });
            } catch (error) {
              console.error("Error during time scale sync:", error);
            } finally {
              setTimeout(() => setSyncingCharts(false), 50);
            }
          };

          // Run the sync function
          syncTimeScales();

          // Force resize after initialization to ensure visibility
          setTimeout(() => {
            priceChart.resize(containerWidth, chartHeight * 0.6);
            pressureChart.resize(containerWidth, chartHeight * 0.2);
            totalVolumeChart.resize(containerWidth, chartHeight * 0.2);
            setChartsReady(true);
          }, 100);

          // Handle resize
          const handleResize = () => {
            if (
              chartComponents.current &&
              priceChartRef.current &&
              pressureChartRef.current &&
              totalVolumeChartRef.current
            ) {
              // Debounce resize to prevent performance issues
              if (resizeTimeout.current) {
                clearTimeout(resizeTimeout.current);
              }

              resizeTimeout.current = setTimeout(() => {
                try {
                  // Add null check before destructuring
                  if (!chartComponents.current) return;

                  const { priceChart, pressureChart, totalVolumeChart } =
                    chartComponents.current;

                  // Add proper null check
                  if (
                    !priceChartRef.current ||
                    !pressureChartRef.current ||
                    !totalVolumeChartRef.current
                  ) {
                    console.warn(
                      "Chart ref elements not available during resize",
                    );
                    return;
                  }

                  const containerWidth =
                    priceChartRef.current.parentElement?.clientWidth || 800;
                  const windowHeight = window.innerHeight;
                  const chartHeight = windowHeight - 280;

                  priceChart.resize(containerWidth, chartHeight * 0.6);
                  pressureChart.resize(containerWidth, chartHeight * 0.2);
                  totalVolumeChart.resize(containerWidth, chartHeight * 0.2);
                } catch (err) {
                  console.error("Error during chart resize:", err);
                }
              }, 100);
            }
          };

          window.addEventListener("resize", handleResize);
          return () => {
            window.removeEventListener("resize", handleResize);
            if (resizeTimeout.current) {
              clearTimeout(resizeTimeout.current);
            }
          };
        } catch (error) {
          console.error("Error initializing charts:", error);
        }
      }, 300); // Longer delay for initial render

      return () => clearTimeout(initTimer);
    }
  }, [syncingCharts, theme]); // Added theme dependency

  // Apply theme changes dynamically
  useEffect(() => {
    if (!chartComponents.current) return;

    console.log(`Applying ${theme} theme to orderbook charts...`);
    const chartTheme = getChartTheme(theme);
    const {
      priceChart,
      pressureChart,
      totalVolumeChart,
      candleSeries,
      pressureSeries,
      totalVolumeSeries,
    } = chartComponents.current;

    // Apply general layout/grid/scale/crosshair options
    const commonOptionsUpdates = {
      layout: {
        background: { type: ColorType.Solid, color: chartTheme.background },
        textColor: chartTheme.text,
      },
      grid: {
        vertLines: { color: chartTheme.grid },
        horzLines: { color: chartTheme.grid },
      },
      timeScale: {
        borderColor: chartTheme.border,
      },
      rightPriceScale: {
        borderColor: chartTheme.border,
      },
      crosshair: {
        vertLine: {
          color: chartTheme.crosshair,
          labelBackgroundColor: chartTheme.crosshairLabelBg,
        },
        horzLine: {
          color: chartTheme.crosshair,
          labelBackgroundColor: chartTheme.crosshairLabelBg,
        },
      },
    };

    priceChart.applyOptions(commonOptionsUpdates);
    pressureChart.applyOptions(commonOptionsUpdates);
    totalVolumeChart.applyOptions(commonOptionsUpdates);

    // Apply series specific options
    candleSeries.applyOptions({
      upColor: chartTheme.candleUp,
      downColor: chartTheme.candleDown,
      wickUpColor: chartTheme.candleUp,
      wickDownColor: chartTheme.candleDown,
    });

    pressureSeries.applyOptions({
      color: "rgba(0, 0, 0, 0)",
    });

    totalVolumeSeries.applyOptions({
      color: chartTheme.totalVolume,
    });
  }, [theme]);

  // Connect to Kline WebSocket for live price updates
  useEffect(() => {
    if (!isMountedRef.current) return;

    if (wsKlineRef.current) {
      try {
        if (
          wsKlineRef.current.readyState !== 3 &&
          wsKlineRef.current.readyState !== 2
        ) {
          console.log(
            `Closing existing Kline WebSocket for ${selectedSymbol} / ${selectedTimeframe}...`,
          );
          wsKlineRef.current.close(1000, "Symbol or timeframe changed");
        }
      } catch (err) {
        console.error("Error closing Kline WebSocket on change:", err);
      }
      wsKlineRef.current = null;
    }

    console.log(
      `Creating Kline WebSocket for ${selectedSymbol} / ${selectedTimeframe}`,
    );

    // Create a WebSocket for kline data
    const wsEndpoint = `wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@kline_${selectedTimeframe}`;

    try {
      const wsKline = new WebSocket(wsEndpoint);

      wsKline.onopen = () => {
        console.log("Kline WebSocket connected");
      };

      wsKline.onclose = (event) => {
        console.log("Kline WebSocket closed", event);
        if (wsKlineRef.current === wsKline) {
          wsKlineRef.current = null;
        }
      };

      wsKline.onerror = (error) => {
        console.error("Kline WebSocket error:", error);
      };

      wsKline.onmessage = (event) => {
        if (!isMountedRef.current || !chartComponents.current) return;

        try {
          const data = JSON.parse(event.data) as BinanceKlineUpdate;
          if (data.e === "kline") {
            const { k } = data;

            // Convert to CandlestickData format
            const newCandle: CandlestickData = {
              time: (k.t / 1000) as UTCTimestamp,
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
            };

            // Check if this is an update to the last candle or a new one
            if (
              lastKlineRef.current &&
              lastKlineRef.current.time === newCandle.time
            ) {
              // Update existing candle
              console.log(
                `Updating candle at ${new Date(k.t).toISOString()}: ${k.c}`,
              );

              // Replace last candle with updated one
              if (chartComponents.current?.candleSeries) {
                chartComponents.current.candleSeries.update(newCandle);
              }

              // Update in internal state
              lastKlineRef.current = newCandle;

              // If the candle is closed, update the full klineData array
              if (k.x) {
                setKlineData((prevData) => {
                  const newData = [...prevData];
                  if (
                    newData.length > 0 &&
                    newData[newData.length - 1].time === newCandle.time
                  ) {
                    newData[newData.length - 1] = newCandle;
                  } else {
                    newData.push(newCandle);
                  }
                  return newData;
                });
              }
            } else if (
              k.x ||
              !lastKlineRef.current ||
              (newCandle.time as number) > (lastKlineRef.current.time as number)
            ) {
              // This is a new candle
              console.log(
                `New candle at ${new Date(k.t).toISOString()}: ${k.o} -> ${k.c}`,
              );

              // Add new candle
              if (chartComponents.current?.candleSeries) {
                chartComponents.current.candleSeries.update(newCandle);
              }

              // Update in state
              lastKlineRef.current = newCandle;
              setKlineData((prevData) => {
                const newData = [...prevData];
                // Only add if it's not already the last candle
                if (
                  newData.length === 0 ||
                  newData[newData.length - 1].time !== newCandle.time
                ) {
                  newData.push(newCandle);
                  // Keep array size manageable
                  if (newData.length > 300) {
                    return newData.slice(-300);
                  }
                }
                return newData;
              });
            }
          }
        } catch (error) {
          console.error("Error processing Kline WebSocket message:", error);
        }
      };

      wsKlineRef.current = wsKline;

      return () => {
        try {
          if (wsKline.readyState !== 3 && wsKline.readyState !== 2) {
            wsKline.close(1000, "Component changed or unmounted");
          }
        } catch (err) {
          console.error("Error closing Kline WebSocket in cleanup:", err);
        }
      };
    } catch (error) {
      console.error("Error creating Kline WebSocket:", error);
    }
  }, [selectedSymbol, selectedTimeframe]);

  // Modify the historical Kline data fetching to set the lastKlineRef
  useEffect(() => {
    if (!selectedSymbol || !selectedTimeframe) return;

    const fetchKlines = async () => {
      setLoadingKlines(true);
      console.log(
        `Fetching klines for ${selectedSymbol}, timeframe ${selectedTimeframe}`,
      );
      try {
        const limit = 200; // Get more data

        // Important: Don't use endTime - let the API give you the most recent data
        const url = `https://api.binance.com/api/v3/klines?symbol=${selectedSymbol.toUpperCase()}&interval=${selectedTimeframe}&limit=${limit}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawData: any[] = await response.json();

        // Log the time range to debug
        if (rawData.length > 0) {
          const firstTime = new Date(rawData[0][0]);
          const lastTime = new Date(rawData[rawData.length - 1][0]);
          console.log(
            `Kline data range: ${firstTime.toISOString()} to ${lastTime.toISOString()}`,
          );
        }

        const formattedData: CandlestickData[] = rawData.map((k: any) => ({
          time: (k[0] / 1000) as UTCTimestamp,
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
        }));

        setKlineData(formattedData);

        // Store the last kline for WebSocket updates
        if (formattedData.length > 0) {
          lastKlineRef.current = formattedData[formattedData.length - 1];
        }

        console.log(`Fetched ${formattedData.length} klines.`);
      } catch (error) {
        console.error("Failed to fetch kline data:", error);
        setKlineData([]); // Clear data on error
        lastKlineRef.current = null;
      } finally {
        setLoadingKlines(false);
      }
    };

    fetchKlines();
  }, [selectedSymbol, selectedTimeframe]);

  // Reconnect function
  const reconnectWithCurrentTimeframe = () => {
    if (!isMountedRef.current) {
      console.log("Component unmounted, skipping reconnect");
      return;
    }

    const backoffTime = Math.min(1000 * Math.pow(1.5, reconnectCount), 30000);
    console.log(
      `Scheduling reconnect attempt in ${backoffTime}ms (attempt #${
        reconnectCount + 1
      })`,
    );

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      try {
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
      if (!isMountedRef.current) {
        console.log("Component unmounted during reconnect timeout");
        return;
      }

      setReconnectCount((prev) => prev + 1);
      setLastUpdate(`Reconnecting (attempt ${reconnectCount + 1})...`);
      setLoadingWebsocket(true);
      dataMapRef.current = new Map<number, VolumeData>();
      setVolumeData([]);

      try {
        const newWs = createBinanceWebSocket(
          selectedSymbol,
          () => {
            if (!isMountedRef.current) return;
            console.log("WS Connected (Reconnect)");
            setConnected(true);
            setLastUpdate("Connected to Binance WebSocket");
            setLoadingWebsocket(false);
            setReconnectCount(0);

            // Force charts to refresh when WebSocket connects
            if (chartComponents.current) {
              const { priceChart, pressureChart, totalVolumeChart } =
                chartComponents.current;
              setTimeout(() => {
                // Force resize to trigger redraw
                if (
                  priceChartRef.current &&
                  pressureChartRef.current &&
                  totalVolumeChartRef.current
                ) {
                  const width = priceChartRef.current.clientWidth;
                  const height = window.innerHeight - 280;

                  priceChart.resize(width, height * 0.6);
                  pressureChart.resize(width, height * 0.2);
                  totalVolumeChart.resize(width, height * 0.2);

                  // Force time scale to focus on most recent data
                  // Only try to set visible range if we have enough data
                  if (klineData.length > 5) {
                    console.log(
                      `Setting visible range from ${klineData.length} klines after WS connect`,
                    );
                    const lastIndex = klineData.length - 1;
                    const fromIndex = Math.max(0, lastIndex - 30);

                    const visibleRange = {
                      from: klineData[fromIndex].time as UTCTimestamp,
                      to: ((klineData[lastIndex].time as number) +
                        300) as UTCTimestamp,
                    };

                    try {
                      // Only try setting visual range after a delay to ensure chart is ready
                      setTimeout(() => {
                        try {
                          // Use fitContent first for safety
                          priceChart.timeScale().fitContent();
                          pressureChart.timeScale().fitContent();
                          totalVolumeChart.timeScale().fitContent();

                          // Then try to set specific range with proper error handling
                          console.log(
                            "Setting chart visible ranges:",
                            visibleRange,
                          );
                          try {
                            priceChart
                              .timeScale()
                              .setVisibleRange(visibleRange);
                          } catch (e) {}
                          try {
                            pressureChart
                              .timeScale()
                              .setVisibleRange(visibleRange);
                          } catch (e) {}
                          try {
                            totalVolumeChart
                              .timeScale()
                              .setVisibleRange(visibleRange);
                          } catch (e) {}
                        } catch (e) {
                          console.warn(
                            "Failed to set chart ranges after WS connect:",
                            e,
                          );
                        }
                      }, 300);
                    } catch (e) {
                      console.warn(
                        "Error preparing visible range after WS connect:",
                        e,
                      );
                    }
                  } else {
                    console.log(
                      "Not enough kline data to set visible range after WS connect",
                    );
                    // Just fit content if not enough data
                    try {
                      priceChart.timeScale().fitContent();
                    } catch (e) {}
                    try {
                      pressureChart.timeScale().fitContent();
                    } catch (e) {}
                    try {
                      totalVolumeChart.timeScale().fitContent();
                    } catch (e) {}
                  }
                }
              }, 200);
            }
          },
          (event) => {
            if (!isMountedRef.current) return;
            console.log("WS Disconnected (Reconnect)", event);
            setConnected(false);
            setLoadingWebsocket(true);
            setLastUpdate(
              `Disconnected: ${event.reason || "Unknown reason"} (${event.code})`,
            );
            if (event.code !== 1000 && isMountedRef.current) {
              reconnectWithCurrentTimeframe();
            }
          },
          (error) => {
            if (!isMountedRef.current) return;
            console.error("WS Error (Reconnect):", error);
            setLastUpdate(
              `WebSocket error: ${new Date().toLocaleTimeString()}`,
            );
          },
          (event) => {
            if (!isMountedRef.current) return;
            try {
              const data = JSON.parse(event.data) as BinanceDepthUpdate;
              if (data.b && data.a) {
                const now = Date.now();
                const currentTimeFrameMs =
                  TIMEFRAMES[
                    currentTimeframeRef.current as keyof typeof TIMEFRAMES
                  ] * 1000;
                const timeframeTimestamp =
                  Math.floor(now / currentTimeFrameMs) * currentTimeFrameMs;

                const { buyVolume, sellVolume } = processDepthData(data);

                const dataMap = dataMapRef.current;
                if (dataMap.has(timeframeTimestamp)) {
                  const existing = dataMap.get(timeframeTimestamp)!;
                  dataMap.set(timeframeTimestamp, {
                    time: timeframeTimestamp,
                    buyVolume: existing.buyVolume + buyVolume,
                    sellVolume: existing.sellVolume + sellVolume,
                  });
                } else {
                  dataMap.set(timeframeTimestamp, {
                    time: timeframeTimestamp,
                    buyVolume,
                    sellVolume,
                  });
                }

                const newData = Array.from(dataMap.values())
                  .sort((a, b) => a.time - b.time)
                  .slice(-100);

                if (isMountedRef.current) {
                  setVolumeData(newData);
                  setLastUpdate(
                    `Last update: ${formatTimestamp(now)} (${currentTimeframeRef.current})`,
                  );
                  if (loadingWebsocket && newData.length > 0) {
                    setLoadingWebsocket(false);
                  }
                }
              }
            } catch (error) {
              console.error("Error processing WebSocket message:", error);
            }
          },
        );
        if (isMountedRef.current) {
          wsRef.current = newWs;
        } else {
          newWs.close(1000, "Component unmounted during creation");
        }
      } catch (error) {
        console.error("Error creating WebSocket (Reconnect):", error);
        if (isMountedRef.current) {
          reconnectWithCurrentTimeframe();
        }
      }
    }, backoffTime);
  };

  // Connect to WebSocket
  useEffect(() => {
    if (!isMountedRef.current) return;

    currentTimeframeRef.current = selectedTimeframe;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      try {
        if (ws.readyState !== 3 && ws.readyState !== 2) {
          console.log(
            `Closing existing WebSocket for ${selectedSymbol} / ${selectedTimeframe}...`,
          );
          ws.close(1000, "Symbol or timeframe changed");
        }
      } catch (err) {
        console.error("Error closing WebSocket on change:", err);
      }
    }

    dataMapRef.current = new Map<number, VolumeData>();
    setVolumeData([]);
    setLoadingWebsocket(true);
    setConnected(false);
    setLastUpdate(`Connecting to ${formatPairName(selectedSymbol)}...`);
    setReconnectCount(0);

    console.log(
      `Attempting WS connection for ${selectedSymbol} / ${selectedTimeframe}`,
    );

    const timeoutId = setTimeout(() => {
      if (!isMountedRef.current) {
        console.log("Component unmounted, skipping WS creation");
        return;
      }
      try {
        const ws = createBinanceWebSocket(
          selectedSymbol,
          () => {
            if (!isMountedRef.current) return;
            console.log("WS Connected (Initial)");
            setConnected(true);
            setLastUpdate("Connected to Binance WebSocket");
            setLoadingWebsocket(false);
            setReconnectCount(0);

            // Force charts to refresh when WebSocket connects
            if (chartComponents.current) {
              const { priceChart, pressureChart, totalVolumeChart } =
                chartComponents.current;
              setTimeout(() => {
                // Force resize to trigger redraw
                if (
                  priceChartRef.current &&
                  pressureChartRef.current &&
                  totalVolumeChartRef.current
                ) {
                  const width = priceChartRef.current.clientWidth;
                  const height = window.innerHeight - 280;

                  priceChart.resize(width, height * 0.6);
                  pressureChart.resize(width, height * 0.2);
                  totalVolumeChart.resize(width, height * 0.2);

                  // Force time scale to focus on most recent data
                  // Only try to set visible range if we have enough data
                  if (klineData.length > 5) {
                    console.log(
                      `Setting visible range from ${klineData.length} klines after WS connect`,
                    );
                    const lastIndex = klineData.length - 1;
                    const fromIndex = Math.max(0, lastIndex - 30);

                    const visibleRange = {
                      from: klineData[fromIndex].time as UTCTimestamp,
                      to: ((klineData[lastIndex].time as number) +
                        300) as UTCTimestamp,
                    };

                    try {
                      // Only try setting visual range after a delay to ensure chart is ready
                      setTimeout(() => {
                        try {
                          // Use fitContent first for safety
                          priceChart.timeScale().fitContent();
                          pressureChart.timeScale().fitContent();
                          totalVolumeChart.timeScale().fitContent();

                          // Then try to set specific range with proper error handling
                          console.log(
                            "Setting chart visible ranges:",
                            visibleRange,
                          );
                          try {
                            priceChart
                              .timeScale()
                              .setVisibleRange(visibleRange);
                          } catch (e) {}
                          try {
                            pressureChart
                              .timeScale()
                              .setVisibleRange(visibleRange);
                          } catch (e) {}
                          try {
                            totalVolumeChart
                              .timeScale()
                              .setVisibleRange(visibleRange);
                          } catch (e) {}
                        } catch (e) {
                          console.warn(
                            "Failed to set chart ranges after WS connect:",
                            e,
                          );
                        }
                      }, 300);
                    } catch (e) {
                      console.warn(
                        "Error preparing visible range after WS connect:",
                        e,
                      );
                    }
                  } else {
                    console.log(
                      "Not enough kline data to set visible range after WS connect",
                    );
                    // Just fit content if not enough data
                    try {
                      priceChart.timeScale().fitContent();
                    } catch (e) {}
                    try {
                      pressureChart.timeScale().fitContent();
                    } catch (e) {}
                    try {
                      totalVolumeChart.timeScale().fitContent();
                    } catch (e) {}
                  }
                }
              }, 200);
            }
          },
          (event) => {
            if (!isMountedRef.current) return;
            console.log("WS Disconnected (Initial)", event);
            setConnected(false);
            setLoadingWebsocket(true);
            setLastUpdate(
              `Disconnected: ${event.reason || "Unknown reason"} (${event.code})`,
            );
            if (event.code !== 1000 && isMountedRef.current) {
              reconnectWithCurrentTimeframe();
            }
          },
          (error) => {
            if (!isMountedRef.current) return;
            console.error("WS Error (Initial):", error);
            setLastUpdate(
              `WebSocket error: ${new Date().toLocaleTimeString()}`,
            );
          },
          (event) => {
            if (!isMountedRef.current) return;
            try {
              const data = JSON.parse(event.data) as BinanceDepthUpdate;
              if (data.b && data.a) {
                const now = Date.now();
                const currentTimeFrameMs =
                  TIMEFRAMES[
                    currentTimeframeRef.current as keyof typeof TIMEFRAMES
                  ] * 1000;
                const timeframeTimestamp =
                  Math.floor(now / currentTimeFrameMs) * currentTimeFrameMs;

                const { buyVolume, sellVolume } = processDepthData(data);

                const dataMap = dataMapRef.current;
                if (dataMap.has(timeframeTimestamp)) {
                  const existing = dataMap.get(timeframeTimestamp)!;
                  dataMap.set(timeframeTimestamp, {
                    time: timeframeTimestamp,
                    buyVolume: existing.buyVolume + buyVolume,
                    sellVolume: existing.sellVolume + sellVolume,
                  });
                } else {
                  dataMap.set(timeframeTimestamp, {
                    time: timeframeTimestamp,
                    buyVolume,
                    sellVolume,
                  });
                }

                const newData = Array.from(dataMap.values())
                  .sort((a, b) => a.time - b.time)
                  .slice(-100);

                if (isMountedRef.current) {
                  setVolumeData(newData);
                  setLastUpdate(
                    `Last update: ${formatTimestamp(now)} (${currentTimeframeRef.current})`,
                  );
                  if (loadingWebsocket && newData.length > 0) {
                    setLoadingWebsocket(false);
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
          ws.close(1000, "Component unmounted during creation");
        }
      } catch (error) {
        console.error("Error creating WebSocket (Initial):", error);
        if (isMountedRef.current) {
          reconnectWithCurrentTimeframe();
        }
      }
    }, 100);

    return () => {
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

  // Update PRICE chart with new KLINE data (updated)
  useEffect(() => {
    if (!chartComponents.current || !klineData.length || !chartsReady) {
      if (chartComponents.current?.candleSeries) {
        chartComponents.current.candleSeries.setData([]);
      }
      return;
    }

    const { candleSeries, priceChart } = chartComponents.current;

    try {
      console.log(`Updating price chart with ${klineData.length} klines.`);

      // Set data
      candleSeries.setData(klineData);

      // Only set visible range if we have enough data
      if (klineData.length > 5) {
        // Force focus on the most recent data (last 30 candles)
        const lastIndex = klineData.length - 1;
        const fromIndex = Math.max(0, lastIndex - 30);

        // Create a visible range object
        const visibleRange = {
          from: klineData[fromIndex].time as UTCTimestamp,
          to: ((klineData[lastIndex].time as number) + 300) as UTCTimestamp, // Add 5 min buffer
        };

        console.log("Setting visible range:", visibleRange);

        try {
          // Apply to price chart
          priceChart.timeScale().setVisibleRange(visibleRange);
        } catch (err) {
          console.warn("Could not set visible range on price chart:", err);
          // Fallback to fitContent
          priceChart.timeScale().fitContent();
        }
      } else {
        // Not enough data, just fit what we have
        priceChart.timeScale().fitContent();
      }

      // Force a redraw
      setTimeout(() => {
        if (priceChartRef.current) {
          priceChart.applyOptions({ width: priceChartRef.current.clientWidth });
        }
      }, 50);
    } catch (err) {
      console.error("Error setting kline data on chart:", err);
    }
  }, [klineData, chartsReady]);

  // Update VOLUME charts with new WebSocket data AND THEME (updated)
  useEffect(() => {
    if (!chartComponents.current || volumeData.length === 0 || !chartsReady) {
      // Clear volume series if no data
      if (chartComponents.current?.pressureSeries)
        chartComponents.current.pressureSeries.setData([]);
      if (chartComponents.current?.totalVolumeSeries)
        chartComponents.current.totalVolumeSeries.setData([]);
      return;
    }

    const chartTheme = getChartTheme(theme);
    const {
      pressureSeries,
      totalVolumeSeries,
      pressureChart,
      totalVolumeChart,
      priceChart,
    } = chartComponents.current;

    try {
      console.log(
        `Updating volume charts (${theme} theme) with ${volumeData.length} bars`,
      );

      // Format data for pressure series (Net Pressure) using THEME colors
      const pressureChartData: HistogramData[] = volumeData.map((item) => {
        const netPressure = Math.abs(item.buyVolume - item.sellVolume);
        const isBuyDominant = item.buyVolume > item.sellVolume;
        return {
          time: (item.time / 1000) as UTCTimestamp,
          value: netPressure,
          color: isBuyDominant ? chartTheme.volumeBuy : chartTheme.volumeSell,
        };
      });

      // Format data for total volume series using THEME color
      const totalVolumeChartData: HistogramData[] = volumeData.map((item) => ({
        time: (item.time / 1000) as UTCTimestamp,
        value: item.buyVolume + item.sellVolume,
        color: chartTheme.totalVolume,
      }));

      // Update charts
      pressureSeries.setData(pressureChartData);
      totalVolumeSeries.setData(totalVolumeChartData);

      // If we have volume data, set the time range on all charts to focus on recent data
      if (volumeData.length >= 5) {
        // Calculate visible range from most recent 30 bars
        const lastIndex = volumeData.length - 1;
        const fromIndex = Math.max(0, lastIndex - 30);

        const visibleRange = {
          from: (volumeData[fromIndex].time / 1000) as UTCTimestamp,
          to: (volumeData[lastIndex].time / 1000 + 300) as UTCTimestamp, // Add 5 min buffer
        };

        console.log("Setting volume visible range:", visibleRange);

        try {
          // Apply to all charts with proper error handling
          try {
            priceChart.timeScale().setVisibleRange(visibleRange);
          } catch (err) {
            console.warn("Could not set visible range on price chart:", err);
          }

          try {
            pressureChart.timeScale().setVisibleRange(visibleRange);
          } catch (err) {
            console.warn("Could not set visible range on pressure chart:", err);
          }

          try {
            totalVolumeChart.timeScale().setVisibleRange(visibleRange);
          } catch (err) {
            console.warn(
              "Could not set visible range on total volume chart:",
              err,
            );
          }
        } catch (rangeError) {
          console.warn(
            "Could not restore logical range, fitting content:",
            rangeError,
          );
          // Fallback to fitContent for all charts
          try {
            priceChart.timeScale().fitContent();
          } catch (e) {}
          try {
            pressureChart.timeScale().fitContent();
          } catch (e) {}
          try {
            totalVolumeChart.timeScale().fitContent();
          } catch (e) {}
        }
      } else {
        // Not enough volume data, fit content
        try {
          priceChart.timeScale().fitContent();
        } catch (e) {}
        try {
          pressureChart.timeScale().fitContent();
        } catch (e) {}
        try {
          totalVolumeChart.timeScale().fitContent();
        } catch (e) {}
      }
    } catch (error) {
      console.error("Error updating volume chart data:", error);
    }
  }, [volumeData, theme, chartsReady]); // Added chartsReady dependency

  // Component Lifecycle: Set/unset mounted flag (updated with better cleanup)
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;

      // Properly remove charts to prevent memory leaks
      if (chartComponents.current) {
        try {
          const { priceChart, pressureChart, totalVolumeChart } =
            chartComponents.current;
          priceChart.remove();
          pressureChart.remove();
          totalVolumeChart.remove();
        } catch (err) {
          console.error("Error removing charts during cleanup:", err);
        }
        chartComponents.current = null;
      }

      // Clean up WebSockets
      [wsRef, wsKlineRef].forEach((ref) => {
        if (ref.current) {
          try {
            if (ref.current.readyState !== 3 && ref.current.readyState !== 2) {
              ref.current.close(1000, "Component unmounted");
            }
          } catch (err) {
            console.error("Error closing WebSocket on unmount:", err);
          }
          ref.current = null;
        }
      });

      // Clear any timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
        resizeTimeout.current = null;
      }
    };
  }, []);

  // Get latest data points for display
  const latestKline = klineData.length ? klineData[klineData.length - 1] : null;
  const latestVolume = volumeData.length
    ? volumeData[volumeData.length - 1]
    : null;

  // Theme-aware Tailwind classes
  const currentChartTheme = getChartTheme(theme);
  const twBgColor = theme === "light" ? "bg-gray-100" : "bg-[#060a10]";
  const twCardBgColor = theme === "light" ? "bg-white" : "bg-[#0f1217]";
  const twBorderColor =
    theme === "light" ? "border-gray-200" : "border-[#252830]";
  const twControlBgColor = theme === "light" ? "bg-gray-50" : "bg-[#161b24]";
  const twControlBorderColor =
    theme === "light" ? "border-gray-300" : "border-[#252a36]";
  const twTextColor = theme === "light" ? "text-gray-800" : "text-slate-100";
  const twSubTextColor = theme === "light" ? "text-gray-600" : "text-slate-400";
  const twSelectTextColor = theme === "light" ? "text-gray-900" : "text-white";
  const twIconColor = theme === "light" ? "text-gray-500" : "text-slate-400";
  const twLegendTextColor =
    theme === "light" ? "text-gray-700" : "text-slate-200";
  const twSeparatorColor =
    theme === "light" ? "border-gray-200" : "border-gray-800";

  // Combined loading state
  const isLoading = loadingKlines || loadingWebsocket;

  return (
    <div
      className={`flex min-h-screen w-full flex-col p-2 md:p-5 ${twBgColor} ${twTextColor}`}
    >
      <div className="mb-3 md:mb-5">
        <h1 className={`mb-1 text-lg font-bold md:text-xl ${twTextColor}`}>
          Order Book Volume & Price Analysis
        </h1>
        <p className={`text-xs md:text-sm ${twSubTextColor}`}>
          Real-time order book depth with price context
        </p>
      </div>

      <div
        className={`${twCardBgColor} ${twBorderColor} mb-3 rounded-xl border p-2 md:mb-5 md:p-4`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div>
              <label
                htmlFor="symbol-select-ob"
                className={`mb-1 block text-xs font-medium md:text-sm ${twSubTextColor}`}
              >
                Trading Pair
              </label>
              <div className="relative inline-block">
                <select
                  id="symbol-select-ob"
                  value={selectedSymbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  className={`${twControlBgColor} ${twControlBorderColor} ${twSelectTextColor} w-28 appearance-none rounded-md border px-3 py-2 pr-8 text-sm font-medium uppercase transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-32 md:text-base`}
                  disabled={isLoading}
                >
                  {COMMON_BINANCE_PAIRS.map((pair) => (
                    <option key={pair} value={pair}>
                      {formatPairName(pair)}
                    </option>
                  ))}
                </select>
                <div
                  className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 ${twIconColor}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="timeframe-select-ob"
                className={`mb-1 block text-xs font-medium md:text-sm ${twSubTextColor}`}
              >
                Timeframe
              </label>
              <div className="relative inline-block">
                <select
                  id="timeframe-select-ob"
                  value={selectedTimeframe}
                  onChange={(e) => handleTimeframeChange(e.target.value)}
                  className={`${twControlBgColor} ${twControlBorderColor} ${twSelectTextColor} w-24 appearance-none rounded-md border px-3 py-2 pr-8 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-28 md:text-base`}
                  disabled={isLoading}
                >
                  {Object.keys(TIMEFRAMES).map((tf) => (
                    <option key={tf} value={tf}>
                      {tf}
                    </option>
                  ))}
                </select>
                <div
                  className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 ${twIconColor}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
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

          <div
            className={`rounded-lg px-2 py-1.5 md:px-4 md:py-2.5 ${
              connected
                ? "bg-emerald-500/20 text-emerald-300"
                : loadingWebsocket
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-red-500/20 text-red-300"
            } border ${
              connected
                ? "border-emerald-600/30"
                : loadingWebsocket
                  ? "border-blue-600/30"
                  : "border-red-600/30"
            } flex items-center`}
          >
            <span
              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full md:mr-2 md:h-2 md:w-2 ${
                connected
                  ? "animate-pulse bg-emerald-400"
                  : loadingWebsocket
                    ? "animate-pulse bg-blue-400"
                    : "bg-red-400"
              }`}
            ></span>
            <span className="text-xs font-medium md:text-sm">{lastUpdate}</span>
          </div>
        </div>
      </div>

      <div
        className={`${twCardBgColor} ${twBorderColor} flex flex-col gap-1 rounded-xl border p-2 md:p-4`}
      >
        <div className="flex flex-col">
          <div className="mb-2 flex items-center justify-between md:mb-2.5">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="flex items-center">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#26a69a] md:mr-2 md:h-2.5 md:w-2.5"></span>
                <span
                  className={`text-sm font-medium md:text-base ${twLegendTextColor}`}
                >
                  Price Up
                </span>
              </div>
              <div className="flex items-center">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#ef5350] md:mr-2 md:h-2.5 md:w-2.5"></span>
                <span
                  className={`text-sm font-medium md:text-base ${twLegendTextColor}`}
                >
                  Price Down
                </span>
              </div>
            </div>
            {latestKline && (
              <div className="text-xs font-semibold md:text-sm">
                <span
                  className={
                    latestKline.close >= latestKline.open
                      ? "text-[#26a69a]"
                      : "text-[#ef5350]"
                  }
                >
                  {latestKline.close.toFixed(2)}
                </span>
              </div>
            )}
          </div>
          {loadingKlines ? (
            <div className="flex h-[calc((100vh-280px)*0.6)] w-full items-center justify-center">
              <div
                className={`h-10 w-10 animate-spin rounded-full border-4 ${currentChartTheme.spinnerBorder} ${currentChartTheme.spinnerTop}`}
              ></div>
            </div>
          ) : (
            <div
              ref={priceChartRef}
              className="h-[calc((100vh-280px)*0.6)] w-full overflow-hidden rounded-md"
            />
          )}
        </div>

        <div className={`mt-1 flex flex-col border-t pt-3 ${twSeparatorColor}`}>
          <div className="mb-2 flex items-center justify-between md:mb-2.5">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="flex items-center">
                <span
                  style={{ backgroundColor: currentChartTheme.volumeBuy }}
                  className="mr-1.5 inline-block h-2 w-2 rounded-full opacity-80 md:mr-2 md:h-2.5 md:w-2.5"
                ></span>
                <span
                  className={`text-sm font-medium md:text-base ${twLegendTextColor}`}
                >
                  Buy Pressure
                </span>
              </div>
              <div className="flex items-center">
                <span
                  style={{ backgroundColor: currentChartTheme.volumeSell }}
                  className="mr-1.5 inline-block h-2 w-2 rounded-full opacity-80 md:mr-2 md:h-2.5 md:w-2.5"
                ></span>
                <span
                  className={`text-sm font-medium md:text-base ${twLegendTextColor}`}
                >
                  Sell Pressure
                </span>
              </div>
            </div>
            {latestVolume && (
              <div className="text-xs font-semibold md:text-sm">
                <span
                  style={{
                    color:
                      latestVolume.buyVolume > latestVolume.sellVolume
                        ? currentChartTheme.volumeBuy
                        : currentChartTheme.volumeSell,
                  }}
                >
                  {formatVolume(
                    Math.abs(latestVolume.buyVolume - latestVolume.sellVolume),
                  )}
                </span>
              </div>
            )}
          </div>
          {loadingWebsocket && volumeData.length === 0 ? (
            <div className="flex h-[calc((100vh-280px)*0.2)] w-full items-center justify-center">
              <div
                className={`h-8 w-8 animate-spin rounded-full border-4 ${currentChartTheme.spinnerBorder} ${currentChartTheme.spinnerTop}`}
              ></div>
            </div>
          ) : (
            <div
              ref={pressureChartRef}
              className="h-[calc((100vh-280px)*0.2)] w-full overflow-hidden rounded-md"
            />
          )}
        </div>

        <div className={`mt-1 flex flex-col border-t pt-3 ${twSeparatorColor}`}>
          <div className="mb-2 flex items-center justify-between md:mb-2.5">
            <div className="flex items-center">
              <span
                style={{ backgroundColor: currentChartTheme.totalVolume }}
                className={`mr-1.5 inline-block h-2 w-2 rounded-full opacity-70 md:mr-2 md:h-2.5 md:w-2.5`}
              ></span>
              <span
                className={`text-sm font-medium md:text-base ${twLegendTextColor}`}
              >
                Total Volume
              </span>
            </div>
            {latestVolume && (
              <div
                className={`text-xs font-semibold md:text-sm ${twSubTextColor}`}
              >
                {formatVolume(latestVolume.buyVolume + latestVolume.sellVolume)}
              </div>
            )}
          </div>
          {loadingWebsocket && volumeData.length === 0 ? (
            <div className="flex h-[calc((100vh-280px)*0.2)] w-full items-center justify-center">
              <div
                className={`h-8 w-8 animate-spin rounded-full border-4 ${currentChartTheme.spinnerBorder} ${currentChartTheme.spinnerTop}`}
              ></div>
            </div>
          ) : (
            <div
              ref={totalVolumeChartRef}
              className="h-[calc((100vh-280px)*0.2)] w-full overflow-hidden rounded-md"
            />
          )}
        </div>
      </div>

      {latestVolume && (
        <div
          className={`${twCardBgColor} ${twBorderColor} ${twSubTextColor} mt-3 rounded-lg border p-2 text-xs md:p-3.5 md:text-sm`}
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:gap-3">
            <div className="flex items-center">
              <IoStatsChart
                className={`mr-2 h-3.5 w-3.5 md:h-5 md:w-5 ${twIconColor}`}
              />
              <div>
                <div className={`text-xs ${twSubTextColor}`}>Total Volume</div>
                <div
                  className={`text-sm font-medium md:text-base ${twTextColor}`}
                >
                  {formatVolume(
                    latestVolume.buyVolume + latestVolume.sellVolume,
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <MdSwapVert
                className={`mr-2 h-3.5 w-3.5 md:h-5 md:w-5 ${twIconColor}`}
              />
              <div>
                <div className={`text-xs ${twSubTextColor}`}>Net Pressure</div>
                <div
                  className={`text-sm font-medium md:text-base`}
                  style={{
                    color:
                      latestVolume.buyVolume > latestVolume.sellVolume
                        ? currentChartTheme.volumeBuy
                        : currentChartTheme.volumeSell,
                  }}
                >
                  {formatVolume(
                    Math.abs(latestVolume.buyVolume - latestVolume.sellVolume),
                  )}
                  <span className="ml-1 text-xs">
                    (
                    {latestVolume.buyVolume > latestVolume.sellVolume
                      ? "Buy"
                      : "Sell"}
                    )
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <FaArrowTrendUp
                className={`mr-2 h-3.5 w-3.5 md:h-5 md:w-5 ${twIconColor}`}
              />
              <div>
                <div className={`text-xs ${twSubTextColor}`}>Buy Volume</div>
                <div
                  className="text-sm font-medium md:text-base"
                  style={{ color: currentChartTheme.volumeBuy }}
                >
                  {formatVolume(latestVolume.buyVolume)}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <FaArrowTrendDown
                className={`mr-2 h-3.5 w-3.5 md:h-5 md:w-5 ${twIconColor}`}
              />
              <div>
                <div className={`text-xs ${twSubTextColor}`}>Sell Volume</div>
                <div
                  className="text-sm font-medium md:text-base"
                  style={{ color: currentChartTheme.volumeSell }}
                >
                  {formatVolume(latestVolume.sellVolume)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
