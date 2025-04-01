"use client";

import dynamic from "next/dynamic";

// Dynamically import BinanceTradeVolumeChart with no SSR
const DynamicTradeVolumeChart = dynamic(
  () => import("./BinanceTradeVolumeChart"),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground flex h-[500px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          <span>Loading trade volume chart...</span>
        </div>
      </div>
    ),
  },
);

export default function ClientChartArea() {
  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Trade Volume Analysis
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Visualize Binance trade volume in real-time to identify market
          activity
        </p>
      </div>

      <div className="bg-card border-border/40 rounded-lg border p-4 shadow-sm md:p-6">
        <DynamicTradeVolumeChart />
      </div>
    </div>
  );
}
