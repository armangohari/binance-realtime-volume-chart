"use client";

import { CandleData } from "@/utils/tradeAggregationUtils";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface TradeVolumeResponse {
  pair: string;
  timeframe: string;
  candles: CandleData[];
}

export function useHistoricalTradeData(pair: string, timeframe: string) {
  return useQuery<TradeVolumeResponse>({
    queryKey: ["tradeVolumeCandles", pair, timeframe],
    queryFn: async () => {
      try {
        const response = await axios.get<TradeVolumeResponse>(
          `/api/trade-volume-candles?pair=${pair.toLowerCase()}&timeframe=${timeframe}`,
        );
        return response.data;
      } catch (error) {
        console.error("Error fetching historical trade data:", error);
        throw error;
      }
    },
    refetchInterval: 500, // Refetch every 0.5 seconds
    staleTime: 500, // Data becomes stale after 0.5 seconds
  });
}
