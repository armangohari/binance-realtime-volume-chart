"use client";

import dynamic from "next/dynamic";

// Dynamically import ChartContainer
const DynamicChartContainer = dynamic(() => import("./ChartContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] flex items-center justify-center">
      Loading chart interface...
    </div>
  ),
});

export default function ChartContainerWrapper() {
  return <DynamicChartContainer />;
}
