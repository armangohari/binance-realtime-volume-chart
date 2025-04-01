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
    <>
      <HistoricalDataSelector onDataLoad={setHistoricalData} />

      {/* Chart component */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <Suspense
          fallback={
            <div className="w-full h-[500px] flex items-center justify-center">
              Loading chart...
            </div>
          }
        >
          {/* TODO: Update BinanceVolumeChart to accept historical data */}
          <BinanceVolumeChart />
        </Suspense>
      </div>
    </>
  );
}
