"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  ISeriesApi,
  UTCTimestamp,
  DeepPartial,
  ChartOptions,
  LineStyle,
  LineWidth,
  SeriesDefinition,
} from "lightweight-charts";

interface VolumeChartProps {
  data: Array<{
    timestamp: number;
    buyVolume: number;
    sellVolume: number;
  }>;
  symbol?: string;
  timeframe?: string;
}

// Define interfaces for our chart references
interface ChartComponents {
  chart: ReturnType<typeof createChart>;
  buySeries: ISeriesApi<"Line">;
  sellSeries: ISeriesApi<"Line">;
}

export function VolumeChart({
  data,
  symbol = "btcusdt",
  timeframe = "1m",
}: VolumeChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartComponents = useRef<ChartComponents | null>(null);

  // Create the chart theme
  const getChartTheme = () => {
    return {
      background: "transparent",
      text: "#c7c7c7",
      grid: "#1a1d25",
      border: "#2a2e39",
    };
  };

  useEffect(() => {
    if (!chartContainerRef.current || chartComponents.current) return;

    const chartTheme = getChartTheme();

    // Initialize chart
    const chartOptions: DeepPartial<ChartOptions> = {
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
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: timeframe.includes("s"),
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
      crosshair: {
        vertLine: {
          color: "rgba(255, 255, 255, 0.2)",
          width: 1 as LineWidth,
          style: LineStyle.Solid,
          labelBackgroundColor: "#2962FF",
        },
        horzLine: {
          color: "rgba(255, 255, 255, 0.2)",
          width: 1 as LineWidth,
          style: LineStyle.Solid,
          labelBackgroundColor: "#2962FF",
        },
        mode: 1,
      },
    };

    // Create chart instance
    const chart = createChart(chartContainerRef.current, chartOptions);

    // Add buy volume series
    const buySeries = chart.addSeries({
      type: "Line",
    } as unknown as SeriesDefinition<"Line">) as ISeriesApi<"Line">;

    // Add sell volume series
    const sellSeries = chart.addSeries({
      type: "Line",
    } as unknown as SeriesDefinition<"Line">) as ISeriesApi<"Line">;

    // Apply options to buy series
    buySeries.applyOptions({
      color: "rgba(59, 130, 246, 1)",
      lineWidth: 2,
      title: "Buy Volume",
      lastValueVisible: true,
      priceLineVisible: false,
      crosshairMarkerVisible: true,
      lineStyle: 0,
      lineType: 0,
    });

    // Apply options to sell series
    sellSeries.applyOptions({
      color: "rgba(239, 68, 68, 1)",
      lineWidth: 2,
      title: "Sell Volume",
      lastValueVisible: true,
      priceLineVisible: false,
      crosshairMarkerVisible: true,
      lineStyle: 0,
      lineType: 0,
    });

    // Store chart components
    chartComponents.current = { chart, buySeries, sellSeries };

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartComponents.current) {
        chartComponents.current.chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Return cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartComponents.current) {
        chartComponents.current.chart.remove();
        chartComponents.current = null;
      }
    };
  }, [timeframe]);

  // Update chart data when data prop changes
  useEffect(() => {
    if (!chartComponents.current || !data || data.length === 0) return;

    // Convert data to the format expected by lightweight-charts
    const buyVolumeData = data.map((item) => ({
      time: (item.timestamp / 1000) as UTCTimestamp, // Convert milliseconds to seconds
      value: item.buyVolume,
    }));

    const sellVolumeData = data.map((item) => ({
      time: (item.timestamp / 1000) as UTCTimestamp, // Convert milliseconds to seconds
      value: item.sellVolume,
    }));

    // Update series data
    chartComponents.current.buySeries.setData(buyVolumeData);
    chartComponents.current.sellSeries.setData(sellVolumeData);

    // Fit content
    chartComponents.current.chart.timeScale().fitContent();
  }, [data]);

  return (
    <div className="border-border/40 bg-card rounded-lg border p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {symbol.toUpperCase()} - {timeframe} Volume
        </h3>
      </div>
      <div ref={chartContainerRef} className="h-[400px] w-full" />
    </div>
  );
}
