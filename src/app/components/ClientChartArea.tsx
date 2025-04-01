"use client";

import { Suspense, useState } from "react";
import HistoricalDataSelector from "./HistoricalDataSelector";
import BinanceVolumeChart from "./BinanceVolumeChart";

// Define the data structure
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

export default function ClientChartArea() {
  const [historicalData, setHistoricalData] =
    useState<OrderbookApiResponse | null>(null);

  // Just logging the data for now
  if (historicalData) {
    console.log(
      `Loaded ${historicalData.count} data points for ${historicalData.symbol}`
    );
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
