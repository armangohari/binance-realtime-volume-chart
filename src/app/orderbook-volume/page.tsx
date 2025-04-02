"use client";

import BinanceVolumeChart from "@/components/features/BinanceOrderbookVolumeChart";
import { TradingViewPriceChart } from "@/components/features/TradingViewPriceChart";
import { LayoutWrapper } from "@/components/ui/layout-wrapper";
import Link from "next/link";
import { MdBarChart, MdStorage } from "react-icons/md";
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
      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Realtime Orderbook Volume
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Monitor orderbook depth and market pressure in real-time
          </p>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="border-border/40 bg-card rounded-lg border p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold tracking-tight">
                About This Chart
              </h2>
              <p className="text-muted-foreground mb-4">
                This chart displays real-time volume data from Binance&apos;s
                orderbook using TradingView&apos;s Lightweight Charts™. This
                professional-grade charting library helps traders identify
                buying and selling pressure in the market by visualizing the
                total volume and the net pressure between buys and sells with
                high performance and low footprint.
              </p>
              <div className="bg-card/50 rounded-md p-4">
                <h3 className="mb-2 text-lg font-medium">How to Use</h3>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Select a trading pair from the dropdown menu</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Choose a timeframe to aggregate the data</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      The top chart shows the total volume (buys + sells)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      The bottom chart shows the net pressure (buys vs sells)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Blue bars indicate buy dominance, red bars indicate sell
                      dominance
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Mouse over the chart to see precise volume values
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <div className="border-border/40 bg-card rounded-lg border p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold tracking-tight">
                Related Tools
              </h2>
              <div className="space-y-4">
                <div className="bg-card/50 rounded-md p-4">
                  <div className="mb-2 flex items-center">
                    <MdBarChart className="text-primary mr-2 h-5 w-5" />
                    <h3 className="font-medium">Trade Volume</h3>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    View actual executed trades and market activity
                  </p>
                  <Link
                    href="/trade-volume"
                    className="text-primary inline-flex items-center text-sm font-medium"
                  >
                    Go to Trade Volume
                  </Link>
                </div>

                <div className="bg-card/50 rounded-md p-4">
                  <div className="mb-2 flex items-center">
                    <MdStorage className="text-primary mr-2 h-5 w-5" />
                    <h3 className="font-medium">Historical Data</h3>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    View and export previously collected data
                  </p>
                  <Link
                    href="/dbviewer"
                    className="text-primary inline-flex items-center text-sm font-medium"
                  >
                    Go to Database Viewer
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Components */}
        <div className="grid gap-6">
          {/* Volume Chart with integrated TradingView Chart */}
          <div className="border-border/40 bg-card rounded-lg border p-4 shadow-sm md:p-6">
            <BinanceVolumeChart
              symbol={symbol}
              timeframe={timeframe}
              onSymbolChange={handleSymbolChange}
              onTimeframeChange={handleTimeframeChange}
              showPriceChart={true}
            />
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
