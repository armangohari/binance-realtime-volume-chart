"use client";

import { useEffect, useRef } from "react";

interface TradingViewPriceChartProps {
  symbol: string;
  timeframe?: string;
  className?: string;
  hideHeader?: boolean;
}

// Mapping from our timeframe format to TradingView format
const timeframeToTVInterval = (timeframe: string): string => {
  // Convert our timeframe to TradingView interval
  const timeframeMap: Record<string, string> = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1h": "60",
    "4h": "240",
    "1d": "D",
    "1w": "W",
    "1M": "M",
    "1y": "Y",
  };

  return timeframeMap[timeframe] || "1";
};

export function TradingViewPriceChart({
  symbol,
  timeframe = "1m",
  className = "",
  hideHeader = false,
}: TradingViewPriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Constants for styling - matching the dark theme
  const cardBgColor = "bg-[#0f1217]";
  const borderColor = "border-[#252830]";

  useEffect(() => {
    // Clean up any existing TradingView widgets first
    if (containerRef.current && containerRef.current.innerHTML) {
      containerRef.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== "undefined" && containerRef.current) {
        new window.TradingView.widget({
          container_id: containerRef.current.id,
          symbol: `BINANCE:${symbol}`.toUpperCase(),
          theme: "dark",
          locale: "en",
          autosize: true,
          interval: timeframeToTVInterval(timeframe),
          timezone: "exchange",
          style: "1",
          toolbar_bg: "#161b24",
          enable_publishing: false,
          allow_symbol_change: false,
          save_image: true,
          hide_top_toolbar: true,
          hide_side_toolbar: false,
          favorites: {
            intervals: ["1", "5", "15", "30", "60", "240"],
          },
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [symbol, timeframe]);

  return (
    <div className={hideHeader ? "" : "flex flex-col gap-4"}>
      {!hideHeader && (
        <div
          className={`${cardBgColor} rounded-xl p-2 shadow-lg md:p-4 ${borderColor} border`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
            <div className="flex items-center">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#2962FF] md:h-2.5 md:w-2.5"></span>
              <span className="text-sm font-medium text-slate-200 md:text-base">
                Price Chart
              </span>
            </div>
            <div className="text-sm text-slate-400">
              TradingView Powered Chart
            </div>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div
        ref={containerRef}
        id={`tradingview_${symbol}`}
        className={`h-[300px] w-full md:h-[400px] ${className} overflow-hidden rounded-xl ${borderColor} border`}
      />
    </div>
  );
}
