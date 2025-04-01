"use client";

import dynamic from "next/dynamic";

// Dynamically import ChartContainer
const DynamicChartContainer = dynamic(() => import("./ChartContainer"), {
  ssr: false,
  loading: () => (
    <div className="text-muted-foreground flex h-[300px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
        <span>Loading chart interface...</span>
      </div>
    </div>
  ),
});

export default function ChartContainerWrapper() {
  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Market Volume Charts
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Visualize Binance trading volume metrics in real-time
        </p>
      </div>
      <DynamicChartContainer />
    </div>
  );
}
