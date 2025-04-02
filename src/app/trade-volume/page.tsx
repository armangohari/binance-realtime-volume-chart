"use client";

import BinanceTradeVolumeChart from "@/components/features/BinanceTradeVolumeChart";
import { LayoutWrapper } from "@/components/ui/layout-wrapper";
import Link from "next/link";
import { MdShowChart, MdStorage } from "react-icons/md";

export default function TradeVolumePage() {
  return (
    <LayoutWrapper>
      <div className="container px-2 py-4 md:px-4 md:py-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
            Realtime Trade Volume
          </h1>
          <p className="mt-2 text-base text-muted-foreground md:text-lg">
            Analyze executed trades and market activity in real-time
          </p>
        </div>

        <div className="mb-4 grid gap-4 md:mb-8 md:grid-cols-3 md:gap-6">
          <div className="md:col-span-2">
            <div className="rounded-lg border border-border/40 bg-card p-3 shadow-sm md:p-6">
              <h2 className="mb-3 text-lg font-semibold tracking-tight md:mb-4 md:text-xl">
                About This Chart
              </h2>
              <p className="mb-3 text-sm text-muted-foreground md:mb-4 md:text-base">
                This chart displays real-time actual trade volume data from
                Binance using TradingView&apos;s Lightweight Charts™. This
                professional-grade charting library shows only executed trades,
                providing a true picture of market activity and volume with
                interactive, high-performance visualization.
              </p>
              <div className="rounded-md bg-card/50 p-3 md:p-4">
                <h3 className="mb-2 text-base font-medium md:text-lg">
                  How to Use
                </h3>
                <ul className="space-y-2 text-xs text-muted-foreground md:text-sm">
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
                      The top chart shows the total trade volume (buys + sells)
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
                      Interact with the chart to zoom in/out and view specific
                      timeframes
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-lg border border-border/40 bg-card p-3 shadow-sm md:p-6">
              <h2 className="mb-3 text-lg font-semibold tracking-tight md:mb-4 md:text-xl">
                Related Tools
              </h2>
              <div className="space-y-3 md:space-y-4">
                <div className="rounded-md bg-card/50 p-3 md:p-4">
                  <div className="mb-2 flex items-center">
                    <MdShowChart className="mr-2 h-4 w-4 text-primary md:h-5 md:w-5" />
                    <h3 className="text-sm font-medium md:text-base">
                      Orderbook Volume
                    </h3>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground md:mb-3 md:text-sm">
                    View orderbook depth for a different market perspective
                  </p>
                  <Link
                    href="/realtime-volume"
                    className="inline-flex items-center text-xs font-medium text-primary md:text-sm"
                  >
                    Go to Orderbook Volume
                  </Link>
                </div>

                <div className="rounded-md bg-card/50 p-3 md:p-4">
                  <div className="mb-2 flex items-center">
                    <MdStorage className="mr-2 h-4 w-4 text-primary md:h-5 md:w-5" />
                    <h3 className="text-sm font-medium md:text-base">
                      Historical Data
                    </h3>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground md:mb-3 md:text-sm">
                    View and export previously collected data
                  </p>
                  <Link
                    href="/dbviewer"
                    className="inline-flex items-center text-xs font-medium text-primary md:text-sm"
                  >
                    Go to Database Viewer
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Component */}
        <div className="rounded-lg border border-border/40 bg-card p-2 shadow-sm md:p-6">
          <BinanceTradeVolumeChart />
        </div>
      </div>
    </LayoutWrapper>
  );
}
