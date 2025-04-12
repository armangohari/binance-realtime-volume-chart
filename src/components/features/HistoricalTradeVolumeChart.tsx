"use client";

import {
  COMMON_BINANCE_PAIRS,
  TIMEFRAMES,
  formatPairName,
} from "@/constants/binancePairs";
import { useHistoricalTradeData } from "@/hooks/useHistoricalTradeData";
import { formatVolume } from "@/utils/tradeUtils";
import {
  ColorType,
  HistogramSeries,
  ISeriesApi,
  UTCTimestamp,
  createChart,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import { IoStatsChart } from "react-icons/io5";
import { MdSwapVert } from "react-icons/md";
import { TradingViewPriceChart } from "./TradingViewPriceChart";

// Define interfaces for our chart reference
interface CombinedVolumeChart {
  chart: ReturnType<typeof createChart>;
  totalSeries: ISeriesApi<"Histogram">;
  pressureSeries: ISeriesApi<"Histogram">;
}

export default function HistoricalTradeVolumeChart() {
  const volumeChartRef = useRef<HTMLDivElement>(null);
  const volumeChartComponents = useRef<CombinedVolumeChart | null>(null);
  const [symbol, setSymbol] = useState<string>("btcusdt");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1m");

  // Constants for styling
  const bgColor = "bg-[#060a10]";
  const cardBgColor = "bg-[#0f1217]";
  const borderColor = "border-[#252830]";
  const controlBgColor = "bg-[#161b24]";
  const controlBorderColor = "border-[#252a36]";

  // Fetch historical data using React Query
  const { data, isLoading, isError, error } = useHistoricalTradeData(
    symbol,
    selectedTimeframe,
  );

  // Create the chart theme
  const getChartTheme = () => {
    return {
      background: "#0f1217",
      text: "#c7c7c7",
      grid: "#1a1d25",
      border: "#2a2e39",
    };
  };

  // Initialize chart
  useEffect(() => {
    if (volumeChartRef.current && !volumeChartComponents.current) {
      try {
        console.log("Creating combined volume chart...");
        const chartTheme = getChartTheme();

        // Create combined volume chart
        const combinedChart = createChart(volumeChartRef.current, {
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
          width: volumeChartRef.current.clientWidth,
          height: window.innerHeight - 280,
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

        // Total volume series - Light white with transparency (background)
        const totalVolumeSeries = combinedChart.addSeries(HistogramSeries, {
          color: "rgba(220, 220, 240, 0.1)",
          priceFormat: {
            type: "volume",
            precision: 0,
            minMove: 0.01,
          },
          priceScaleId: "right",
        });

        // Pressure series with full opacity (foreground)
        const pressureSeries = combinedChart.addSeries(HistogramSeries, {
          color: "rgba(0, 0, 0, 0)", // Will be set dynamically
          priceFormat: {
            type: "volume",
            precision: 0,
            minMove: 0.01,
          },
          priceScaleId: "right",
        });

        volumeChartComponents.current = {
          chart: combinedChart,
          totalSeries: totalVolumeSeries,
          pressureSeries: pressureSeries,
        };

        // Handle resize
        const handleResize = () => {
          if (volumeChartComponents.current && volumeChartRef.current) {
            volumeChartComponents.current.chart.applyOptions({
              width: volumeChartRef.current.clientWidth,
              height: window.innerHeight - 280,
            });
          }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
      } catch (error) {
        console.error("Error initializing volume chart:", error);
      }
    }
  }, []);

  // Update charts with new data
  useEffect(() => {
    if (!volumeChartComponents.current || !data?.candles.length) return;

    try {
      console.log(
        "Updating volume chart data with",
        data.candles.length,
        "candles",
      );

      // Format data for total volume series (buy + sell)
      const totalVolumeData = data.candles.map((item) => ({
        time: (item.time / 1000) as UTCTimestamp,
        value: item.totalVolume,
        color: "rgba(220, 220, 240, 0.1)", // Semi-transparent white for background
      }));

      // Format data for pressure series with dynamic colors at 100% opacity
      const pressureData = data.candles.map((item) => {
        const netPressure = Math.abs(item.buyVolume - item.sellVolume);
        const isBuyDominant = item.buyVolume > item.sellVolume;

        return {
          time: (item.time / 1000) as UTCTimestamp,
          value: netPressure,
          color: isBuyDominant
            ? "rgba(0, 191, 255, 1.0)" // Full opacity blue
            : "rgba(255, 50, 50, 1.0)", // Full opacity red
        };
      });

      try {
        // Update total volume series (background)
        if (
          volumeChartComponents.current.totalSeries &&
          totalVolumeData.length > 0
        ) {
          volumeChartComponents.current.totalSeries.setData(totalVolumeData);
        }

        // Update pressure series (foreground)
        if (
          volumeChartComponents.current.pressureSeries &&
          pressureData.length > 0
        ) {
          volumeChartComponents.current.pressureSeries.setData(pressureData);
          volumeChartComponents.current.chart.timeScale().fitContent();
        }
      } catch (err) {
        console.error("Error updating volume chart:", err);
      }
    } catch (error) {
      console.error("Error updating chart data:", error);
    }
  }, [data]);

  // Get the latest candle for display (if available)
  const latestCandle = data?.candles.length
    ? data.candles[data.candles.length - 1]
    : null;

  return (
    <div
      className={`flex w-full flex-col ${bgColor} min-h-screen p-2 text-slate-100 md:p-5`}
    >
      {/* Header Section */}
      <div className="mb-3 md:mb-5">
        <h1 className="mb-1 text-lg font-bold md:text-xl">
          Historical Trade Volume Analysis
        </h1>
        <p className="text-xs text-slate-400 md:text-sm">
          Historical trade volume visualization from database
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
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toLowerCase())}
                  className={`${controlBgColor} ${controlBorderColor} w-28 appearance-none rounded-md border px-3 py-2 pr-8 text-sm font-medium uppercase text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-32 md:text-base`}
                  disabled={isLoading}
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
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className={`${controlBgColor} ${controlBorderColor} w-24 appearance-none rounded-md border px-3 py-2 pr-8 text-sm font-medium text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-28 md:text-base`}
                  disabled={isLoading}
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
      <div className="mb-3 grid grid-cols-1 gap-3 md:mb-5 md:gap-5">
        {/* TradingView Price Chart */}
        <TradingViewPriceChart
          symbol={symbol}
          timeframe={selectedTimeframe}
          hideHeader={false}
          hideVolume={true}
        />

        {/* Combined Volume Chart */}
        <div
          className={`${cardBgColor} rounded-xl p-2 shadow-lg md:p-4 ${borderColor} border`}
        >
          <div className="mb-2 flex items-center justify-between md:mb-2.5">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="flex items-center">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#dcdef0] opacity-10 md:mr-2 md:h-2.5 md:w-2.5"></span>
                <span className="text-sm font-medium text-slate-200 md:text-base">
                  Total Volume
                </span>
              </div>
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
            {latestCandle && (
              <div className="text-xs font-semibold md:text-sm">
                <span
                  className={
                    latestCandle.buyVolume > latestCandle.sellVolume
                      ? "text-[#0190FF]"
                      : "text-[#FF3B69]"
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
            <div className="flex h-[400px] w-full items-center justify-center md:h-[calc(100vh-280px)]">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1a1d25] border-t-[#dcdef0]"></div>
            </div>
          ) : (
            <div
              ref={volumeChartRef}
              className="h-[400px] w-full overflow-hidden rounded-md md:h-[calc(100vh-280px)]"
            />
          )}
        </div>
      </div>

      {/* Footer Stats */}
      {latestCandle && (
        <div
          className={`${cardBgColor} rounded-lg p-2 md:p-3.5 ${borderColor} border text-xs text-slate-300 md:text-sm`}
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:gap-3">
            <div className="flex items-center">
              <IoStatsChart className="mr-2 h-3.5 w-3.5 text-slate-400 md:h-5 md:w-5" />
              <div>
                <div className="text-xs text-slate-400">Total Volume</div>
                <div className="text-sm font-medium text-slate-100 md:text-base">
                  {formatVolume(latestCandle.totalVolume)}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <MdSwapVert className="mr-2 h-3.5 w-3.5 text-slate-400 md:h-5 md:w-5" />
              <div>
                <div className="text-xs text-slate-400">Net Pressure</div>
                <div
                  className={`text-sm font-medium md:text-base ${
                    latestCandle.buyVolume > latestCandle.sellVolume
                      ? "text-[#0190FF]"
                      : "text-[#FF3B69]"
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
              <FaArrowTrendUp className="mr-2 h-3.5 w-3.5 text-slate-400 md:h-5 md:w-5" />
              <div>
                <div className="text-xs text-slate-400">Buy Volume</div>
                <div className="text-sm font-medium text-[#0190FF] md:text-base">
                  {formatVolume(latestCandle.buyVolume)}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <FaArrowTrendDown className="mr-2 h-3.5 w-3.5 text-slate-400 md:h-5 md:w-5" />
              <div>
                <div className="text-xs text-slate-400">Sell Volume</div>
                <div className="text-sm font-medium text-[#FF3B69] md:text-base">
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
