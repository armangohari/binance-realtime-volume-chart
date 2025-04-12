"use client";

import BinanceOrderbookVolumeChart from "@/components/features/BinanceOrderbookVolumeChart";
import { LayoutWrapper } from "@/components/ui/layout-wrapper";
import { useState } from "react";

export default function RealtimeVolumePage() {
  // Create shared state for both chart components
  const [symbol, setSymbol] = useState<string>("btcusdt");
  const [timeframe, setTimeframe] = useState<string>("1m");

  // Handle symbol changes
  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
  };

  // Handle timeframe changes
  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
  };

  return (
    <LayoutWrapper>
      {/* Chart Components */}
      <div className="grid gap-6">
        {/* Volume Chart with integrated TradingView Chart */}
        <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm md:p-6">
          <BinanceOrderbookVolumeChart
            symbol={symbol}
            timeframe={timeframe}
            onSymbolChange={handleSymbolChange}
            onTimeframeChange={handleTimeframeChange}
            showPriceChart={true}
          />
        </div>
      </div>
    </LayoutWrapper>
  );
}
