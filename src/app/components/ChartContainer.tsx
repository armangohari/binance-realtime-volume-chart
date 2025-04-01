"use client";

import { useState, Suspense } from "react";
import BinanceVolumeChart from "./BinanceVolumeChart";
import HistoricalDataSelector from "./HistoricalDataSelector";

// Define the data structure returned from the API
export interface OrderbookData {
  time: number;
  buyVolume: number;
  sellVolume: number;
}

// Define the API response structure
export interface OrderbookApiResponse {
  success: boolean;
  data: OrderbookData[];
  timeframe: string;
  symbol: string;
  startTime: number;
  endTime: number;
  count: number;
  message?: string;
}

export default function ChartContainer() {
  const [historicalData, setHistoricalData] =
    useState<OrderbookApiResponse | null>(null);

  // For now, we'll just log historical data until BinanceVolumeChart is updated
  // to use historical data
  if (historicalData) {
    console.log("Historical data loaded:", historicalData);
  }

  return (
    <div className="w-full space-y-4">
      <HistoricalDataSelector onDataLoad={setHistoricalData} />

      {/* Chart component */}
      <div className="bg-card border-border/40 w-full rounded-lg border p-4 shadow-sm md:p-6">
        <Suspense
          fallback={
            <div className="text-muted-foreground flex h-[500px] w-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
                <span>Loading chart...</span>
              </div>
            </div>
          }
        >
          {/* TODO: Update BinanceVolumeChart to accept historical data */}
          <BinanceVolumeChart />
        </Suspense>
      </div>
    </div>
  );
}
