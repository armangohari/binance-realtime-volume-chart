"use client";

import {
  COMMON_BINANCE_PAIRS,
  TIMEFRAMES,
  formatPairName,
} from "@/constants/binancePairs";
import { useHistoricalTradeData } from "@/hooks/useHistoricalTradeData";
import { formatVolume } from "@/utils/tradeUtils";
import {
  CandlestickData,
  CandlestickSeries,
  ColorType,
  HistogramData,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  MouseEventParams,
  UTCTimestamp,
  createChart,
} from "lightweight-charts";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import { IoStatsChart } from "react-icons/io5";
import { MdSwapVert } from "react-icons/md";

// Define interfaces for our chart reference
interface ChartComponents {
  priceChart: IChartApi;
  volumeChart: IChartApi; // Net Pressure
  totalVolumeChart: IChartApi; // Total Volume
  candleSeries: ISeriesApi<"Candlestick">;
  volumeSeries: ISeriesApi<"Histogram">; // Net Pressure
  totalVolumeSeries: ISeriesApi<"Histogram">; // Total Volume
}

export default function TradePriceVolumeChart() {
  const priceChartRef = useRef<HTMLDivElement>(null);
  const volumeChartRef = useRef<HTMLDivElement>(null); // Net Pressure
  const totalVolumeChartRef = useRef<HTMLDivElement>(null); // Total Volume
  const chartComponents = useRef<ChartComponents | null>(null);
  const { theme } = useTheme();
  const [symbol, setSymbol] = useState<string>("btcusdt");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1m");
  const [syncingCharts, setSyncingCharts] = useState<boolean>(false);

  // Fetch historical data using React Query
  const { data, isLoading, isError, error } = useHistoricalTradeData(
    symbol,
    selectedTimeframe,
  );

  // Create the chart theme based on the current theme
  const getChartTheme = (currentTheme: string | undefined) => {
    if (currentTheme === "light") {
      return {
        background: "#ffffff", // White background
        text: "#333333", // Dark text
        grid: "#e0e0e0", // Lighter grid
        border: "#d1d1d1", // Lighter border
        candleUp: "#26a69a", // Green up
        candleDown: "#ef5350", // Red down
        volumeBuy: "rgba(38, 166, 154, 0.7)", // Green buy pressure
        volumeSell: "rgba(239, 83, 80, 0.7)", // Red sell pressure
        totalVolume: "rgba(120, 120, 120, 0.65)", // Darker gray total volume
        crosshair: "rgba(51, 51, 51, 0.3)", // Darker crosshair
        crosshairLabelBg: "#f0f0f0", // Light gray crosshair label bg
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
      volumeBuy: "rgba(38, 166, 154, 0.7)",
      volumeSell: "rgba(239, 83, 80, 0.7)",
      totalVolume: "rgba(220, 220, 240, 0.65)",
      crosshair: "rgba(255, 255, 255, 0.2)",
      crosshairLabelBg: "#2962FF",
      spinnerBorder: "border-[#1a1d25]",
      spinnerTop: "border-t-[#dcdef0]",
    };
  };

  // Initialize charts
  useEffect(() => {
    if (
      priceChartRef.current &&
      volumeChartRef.current &&
      totalVolumeChartRef.current && // Add check for new ref
      !chartComponents.current
    ) {
      try {
        console.log("Creating price, pressure, and total volume charts...");
        const chartTheme = getChartTheme(theme);

        // Common chart options
        const commonOptions = {
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

        // Create price chart (60% height)
        const priceChart = createChart(priceChartRef.current, {
          ...commonOptions,
          width: priceChartRef.current.clientWidth,
          height: (window.innerHeight - 280) * 0.6,
        });

        // Create net pressure volume chart (20% height)
        const volumeChart = createChart(volumeChartRef.current, {
          ...commonOptions,
          width: volumeChartRef.current.clientWidth,
          height: (window.innerHeight - 280) * 0.2,
        });

        // Create total volume chart (20% height)
        const totalVolumeChart = createChart(totalVolumeChartRef.current, {
          ...commonOptions,
          width: totalVolumeChartRef.current.clientWidth,
          height: (window.innerHeight - 280) * 0.2,
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

        // Net pressure volume series
        const volumeSeries = volumeChart.addSeries(HistogramSeries, {
          color: "rgba(0, 0, 0, 0)", // Will be set dynamically
          priceFormat: {
            type: "volume",
            precision: 0,
            minMove: 0.01,
          },
        });

        // Total volume series
        const totalVolumeSeries = totalVolumeChart.addSeries(HistogramSeries, {
          color: chartTheme.totalVolume,
          priceFormat: {
            type: "volume",
            precision: 0,
            minMove: 0.01,
          },
        });

        // Set up synchronization between ALL THREE charts
        const syncTimeScales = () => {
          if (syncingCharts) return;
          setSyncingCharts(true);

          const setTimeoutPromise = () => {
            return new Promise<void>((resolve) => {
              setTimeout(() => {
                setSyncingCharts(false);
                resolve();
              }, 50);
            });
          };

          const syncTimeScale = async () => {
            try {
              const charts = [priceChart, volumeChart, totalVolumeChart];

              // Subscribe to time scale changes on all charts
              charts.forEach((leaderChart, leaderIndex) => {
                const followerCharts = charts.filter(
                  (_, i) => i !== leaderIndex,
                );

                const handleTimeScaleChange = () => {
                  if (syncingCharts) return;
                  setSyncingCharts(true);

                  try {
                    const logicalRange = leaderChart
                      .timeScale()
                      .getVisibleLogicalRange();
                    if (logicalRange !== null) {
                      followerCharts.forEach((followerChart) => {
                        followerChart
                          .timeScale()
                          .setVisibleLogicalRange(logicalRange);
                      });
                    }
                  } finally {
                    setTimeout(() => setSyncingCharts(false), 10);
                  }
                };

                leaderChart
                  .timeScale()
                  .subscribeSizeChange(handleTimeScaleChange);
                leaderChart
                  .timeScale()
                  .subscribeVisibleTimeRangeChange(handleTimeScaleChange);
              });

              // Subscribe to crosshair moves on all charts
              charts.forEach((leaderChart, leaderIndex) => {
                const followerCharts = charts.filter(
                  (_, i) => i !== leaderIndex,
                );

                leaderChart.subscribeCrosshairMove(
                  (param: MouseEventParams) => {
                    if (syncingCharts || !param.time) return;

                    const point = param.point;
                    if (point) {
                      const leaderScrollPos = leaderChart
                        .timeScale()
                        .scrollPosition();
                      followerCharts.forEach((followerChart) => {
                        followerChart
                          .timeScale()
                          .scrollToPosition(leaderScrollPos, false);
                      });
                    }
                  },
                );
              });

              await setTimeoutPromise();
            } catch (error) {
              console.error("Error during time scale synchronization:", error);
            }
          };

          syncTimeScale();
        };

        // Initial sync
        syncTimeScales();

        chartComponents.current = {
          priceChart,
          volumeChart,
          totalVolumeChart, // Add new chart
          candleSeries,
          volumeSeries,
          totalVolumeSeries, // Add new series
        };

        // Handle resize
        const handleResize = () => {
          if (
            chartComponents.current &&
            priceChartRef.current &&
            volumeChartRef.current &&
            totalVolumeChartRef.current // Add check for new ref
          ) {
            const { priceChart, volumeChart, totalVolumeChart } =
              chartComponents.current;
            priceChart.applyOptions({
              width: priceChartRef.current.clientWidth,
              height: (window.innerHeight - 280) * 0.6,
            });
            volumeChart.applyOptions({
              width: volumeChartRef.current.clientWidth,
              height: (window.innerHeight - 280) * 0.2,
            });
            totalVolumeChart.applyOptions({
              // Add resize for new chart
              width: totalVolumeChartRef.current.clientWidth,
              height: (window.innerHeight - 280) * 0.2,
            });
          }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
      } catch (error) {
        console.error("Error initializing charts:", error);
      }
    }
  }, [syncingCharts, theme]);

  // Apply theme changes dynamically
  useEffect(() => {
    if (!chartComponents.current) return; // Only run if charts are initialized

    console.log(`Applying ${theme} theme to charts...`);
    const chartTheme = getChartTheme(theme);
    const {
      priceChart,
      volumeChart,
      totalVolumeChart,
      candleSeries,
      volumeSeries,
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
    volumeChart.applyOptions(commonOptionsUpdates);
    totalVolumeChart.applyOptions(commonOptionsUpdates);

    // Apply series specific options that don't depend on data loop
    candleSeries.applyOptions({
      upColor: chartTheme.candleUp,
      downColor: chartTheme.candleDown,
      wickUpColor: chartTheme.candleUp,
      wickDownColor: chartTheme.candleDown,
    });

    volumeSeries.applyOptions({
      color: "rgba(0, 0, 0, 0)", // Will be set dynamically
    });

    totalVolumeSeries.applyOptions({
      color: chartTheme.totalVolume,
    });

    // Force re-calculation of volume data colors by triggering data update effect
    // This is done by depending on 'theme' in the data update effect below.
  }, [theme]); // Depend only on theme

  // Update charts with new data (and apply theme-specific colors)
  useEffect(() => {
    if (!chartComponents.current || !data?.candles.length) {
      // Clear series if data is empty or loading
      if (chartComponents.current) {
        console.log("Clearing chart data...");
        chartComponents.current.candleSeries.setData([]);
        chartComponents.current.volumeSeries.setData([]);
        chartComponents.current.totalVolumeSeries.setData([]);
      }
      return;
    }

    const chartTheme = getChartTheme(theme); // Get current theme for colors

    try {
      console.log(
        `Updating chart data (${theme} theme) with`,
        data.candles.length,
        "candles",
      );
      const {
        candleSeries,
        volumeSeries,
        totalVolumeSeries,
        priceChart,
        volumeChart,
        totalVolumeChart,
      } = chartComponents.current;

      // Get current visible range BEFORE setting data to preserve view
      const currentVisibleRange = priceChart.timeScale().getVisibleRange();
      const currentLogicalRange = priceChart
        .timeScale()
        .getVisibleLogicalRange();

      // Format data for candlestick series
      const candleData: CandlestickData[] = data.candles.map((item) => ({
        time: (item.time / 1000) as UTCTimestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));

      // Format data for net pressure volume series using THEME colors
      const volumeData: HistogramData[] = data.candles.map((item) => {
        const netPressure = Math.abs(item.buyVolume - item.sellVolume);
        const isBuyDominant = item.buyVolume > item.sellVolume;

        return {
          time: (item.time / 1000) as UTCTimestamp,
          value: netPressure,
          color: isBuyDominant
            ? chartTheme.volumeBuy // Use theme color
            : chartTheme.volumeSell, // Use theme color
        };
      });

      // Format data for total volume series using THEME color
      const totalVolumeData: HistogramData[] = data.candles.map((item) => ({
        time: (item.time / 1000) as UTCTimestamp,
        value: item.totalVolume,
        color: chartTheme.totalVolume, // Use theme color
      }));

      // Update charts with new data
      try {
        // Update series data
        candleSeries.setData(candleData);
        volumeSeries.setData(volumeData);
        totalVolumeSeries.setData(totalVolumeData);

        // Restore view or fit content
        if (currentVisibleRange && currentLogicalRange) {
          // Try to restore previous logical range for smoother updates
          priceChart.timeScale().setVisibleLogicalRange(currentLogicalRange);
          volumeChart.timeScale().setVisibleLogicalRange(currentLogicalRange);
          totalVolumeChart
            .timeScale()
            .setVisibleLogicalRange(currentLogicalRange);
        } else {
          // Fit content if no previous range (initial load or very few bars)
          priceChart.timeScale().fitContent();
          volumeChart.timeScale().fitContent();
          totalVolumeChart.timeScale().fitContent();
        }
      } catch (err) {
        console.error("Error setting chart data:", err);
      }
    } catch (error) {
      console.error("Error processing chart data:", error);
    }
  }, [data, theme]); // Depend on data AND theme

  // Get the latest candle for display (if available)
  const latestCandle = data?.candles.length
    ? data.candles[data.candles.length - 1]
    : null;

  // Get theme for tailwind classes
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

  return (
    <div
      className={`flex min-h-screen w-full flex-col p-2 md:p-5 ${twBgColor} ${twTextColor}`}
    >
      {/* Header Section */}
      <div className="mb-3 md:mb-5">
        <h1 className={`mb-1 text-lg font-bold md:text-xl ${twTextColor}`}>
          Price, Pressure, & Total Volume Analysis
        </h1>
        <p className={`text-xs md:text-sm ${twSubTextColor}`}>
          Multi-pane synchronized visualization
        </p>
      </div>

      {/* Controls Section */}
      <div
        className={`${twCardBgColor} ${twBorderColor} mb-3 rounded-xl border p-2 md:mb-5 md:p-4`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Trading Pair Selector */}
            <div>
              <label
                htmlFor="symbol-select"
                className={`mb-1 block text-xs font-medium md:text-sm ${twSubTextColor}`}
              >
                Trading Pair
              </label>
              <div className="relative inline-block">
                <select
                  id="symbol-select"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toLowerCase())}
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
                className={`mb-1 block text-xs font-medium md:text-sm ${twSubTextColor}`}
              >
                Timeframe
              </label>
              <div className="relative inline-block">
                <select
                  id="timeframe-select"
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
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
              isLoading
                ? "bg-blue-500/20 text-blue-300"
                : isError
                  ? "bg-red-500/20 text-red-300"
                  : "bg-emerald-500/20 text-emerald-300"
            } border ${
              isLoading
                ? "border-blue-600/30"
                : isError
                  ? "border-red-600/30"
                  : "border-emerald-600/30"
            } flex items-center`}
          >
            <span
              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full md:mr-2 md:h-2 md:w-2 ${
                isLoading
                  ? "animate-pulse bg-blue-400"
                  : isError
                    ? "bg-red-400"
                    : "bg-emerald-400"
              }`}
            ></span>
            <span className="text-xs font-medium md:text-sm">
              {isLoading
                ? "Loading data..."
                : isError
                  ? `Error: ${error instanceof Error ? error.message : "Failed to load data"}`
                  : `${data?.candles.length || 0} candles loaded`}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div
        className={`${twCardBgColor} ${twBorderColor} flex flex-col gap-1 rounded-xl border p-2 md:p-4`}
      >
        {/* Price Chart (60%) */}
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
            {latestCandle && (
              <div className="text-xs font-semibold md:text-sm">
                <span
                  className={
                    latestCandle.close >= latestCandle.open
                      ? "text-[#26a69a]"
                      : "text-[#ef5350]"
                  }
                >
                  {latestCandle.close.toFixed(2)}
                </span>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="flex h-[280px] w-full items-center justify-center md:h-[calc((100vh-280px)*0.6)]">
              <div
                className={`h-10 w-10 animate-spin rounded-full border-4 ${currentChartTheme.spinnerBorder} ${currentChartTheme.spinnerTop}`}
              ></div>
            </div>
          ) : (
            <div
              ref={priceChartRef}
              className="h-[280px] w-full overflow-hidden rounded-md md:h-[calc((100vh-280px)*0.6)]"
            />
          )}
        </div>

        {/* Volume Chart (Net Pressure - 20%) */}
        <div
          className={`mt-1 flex flex-col border-t pt-3 ${theme === "light" ? "border-gray-200" : "border-gray-800"}`}
        >
          <div className="mb-2 flex items-center justify-between md:mb-2.5">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="flex items-center">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#26a69a] opacity-60 md:mr-2 md:h-2.5 md:w-2.5"></span>
                <span
                  className={`text-sm font-medium md:text-base ${twLegendTextColor}`}
                >
                  Buy Pressure
                </span>
              </div>
              <div className="flex items-center">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#ef5350] opacity-60 md:mr-2 md:h-2.5 md:w-2.5"></span>
                <span
                  className={`text-sm font-medium md:text-base ${twLegendTextColor}`}
                >
                  Sell Pressure
                </span>
              </div>
            </div>
            {latestCandle && (
              <div className="text-xs font-semibold md:text-sm">
                <span
                  className={
                    latestCandle.buyVolume > latestCandle.sellVolume
                      ? "text-[#26a69a]"
                      : "text-[#ef5350]"
                  }
                >
                  {formatVolume(
                    Math.abs(latestCandle.buyVolume - latestCandle.sellVolume),
                  )}
                </span>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="flex h-[80px] w-full items-center justify-center md:h-[calc((100vh-280px)*0.2)]">
              <div
                className={`h-8 w-8 animate-spin rounded-full border-4 ${currentChartTheme.spinnerBorder} ${currentChartTheme.spinnerTop}`}
              ></div>
            </div>
          ) : (
            <div
              ref={volumeChartRef}
              className="h-[80px] w-full overflow-hidden rounded-md md:h-[calc((100vh-280px)*0.2)]"
            />
          )}
        </div>

        {/* Total Volume Chart (20%) */}
        <div
          className={`mt-1 flex flex-col border-t pt-3 ${theme === "light" ? "border-gray-200" : "border-gray-800"}`}
        >
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
            {latestCandle && (
              <div
                className={`text-xs font-semibold md:text-sm ${twSubTextColor}`}
              >
                {formatVolume(latestCandle.totalVolume)}
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="flex h-[80px] w-full items-center justify-center md:h-[calc((100vh-280px)*0.2)]">
              <div
                className={`h-8 w-8 animate-spin rounded-full border-4 ${currentChartTheme.spinnerBorder} ${currentChartTheme.spinnerTop}`}
              ></div>
            </div>
          ) : (
            <div
              ref={totalVolumeChartRef}
              className="h-[80px] w-full overflow-hidden rounded-md md:h-[calc((100vh-280px)*0.2)]"
            />
          )}
        </div>
      </div>

      {/* Footer Stats */}
      {latestCandle && (
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
                  {formatVolume(latestCandle.totalVolume)}
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
                  className={`text-sm font-medium md:text-base ${
                    latestCandle.buyVolume > latestCandle.sellVolume
                      ? "text-[#26a69a]"
                      : "text-[#ef5350]"
                  }`}
                >
                  {formatVolume(
                    Math.abs(latestCandle.buyVolume - latestCandle.sellVolume),
                  )}
                  <span className="ml-1 text-xs">
                    (
                    {latestCandle.buyVolume > latestCandle.sellVolume
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
                <div className="text-sm font-medium text-[#26a69a] md:text-base">
                  {formatVolume(latestCandle.buyVolume)}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <FaArrowTrendDown
                className={`mr-2 h-3.5 w-3.5 md:h-5 md:w-5 ${twIconColor}`}
              />
              <div>
                <div className={`text-xs ${twSubTextColor}`}>Sell Volume</div>
                <div className="text-sm font-medium text-[#ef5350] md:text-base">
                  {formatVolume(latestCandle.sellVolume)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
