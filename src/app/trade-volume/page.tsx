"use client";

import BinanceTradeVolumeChart from "@/components/features/BinanceTradeVolumeChart";
import HistoricalTradeVolumeChart from "@/components/features/HistoricalTradeVolumeChart";
import { LayoutWrapper } from "@/components/ui/layout-wrapper";
import { useState } from "react";

export default function TradingVolumePage() {
  const [activeTab, setActiveTab] = useState<"realtime" | "historical">(
    "historical",
  );

  return (
    <LayoutWrapper>
      <div className="mb-4 flex flex-wrap items-center border-b border-gray-800">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "realtime"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("realtime")}
        >
          Real-time Data
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "historical"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("historical")}
        >
          Historical Data
        </button>
      </div>

      {activeTab === "realtime" ? (
        <BinanceTradeVolumeChart />
      ) : (
        <HistoricalTradeVolumeChart />
      )}
    </LayoutWrapper>
  );
}
