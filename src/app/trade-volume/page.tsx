"use client";

import Link from "next/link";
import BinanceTradeVolumeChart from "../components/BinanceTradeVolumeChart";

export default function TradeVolumePage() {
  return (
    <div className="min-h-screen bg-[#060a10] p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Realtime Trade Volume</h1>
          <Link
            href="/"
            className="rounded-md bg-blue-600 px-4 py-2 transition-colors hover:bg-blue-700"
          >
            Back to Home
          </Link>
        </div>

        <div className="mb-6 rounded-xl border border-[#252830] bg-[#0f1217] p-6">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="md:w-2/3">
              <h2 className="mb-2 text-xl font-bold">About This Chart</h2>
              <p className="mb-4 text-gray-300">
                This chart displays real-time actual trade volume data from
                Binance. Unlike the orderbook depth chart, this shows only
                executed trades, providing a true picture of market activity and
                volume.
              </p>
              <div className="rounded-lg border border-[#252a36] bg-[#161b24] p-4">
                <h3 className="mb-2 text-lg font-medium">How to Use</h3>
                <ul className="list-inside list-disc space-y-1 text-gray-300">
                  <li>Select a trading pair from the dropdown menu</li>
                  <li>Choose a timeframe to aggregate the data</li>
                  <li>
                    The top chart shows the total trade volume (buys + sells)
                  </li>
                  <li>
                    The bottom chart shows the net pressure (buys vs sells)
                  </li>
                  <li>
                    Blue bars indicate buy dominance, red bars indicate sell
                    dominance
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:w-1/3">
              <h2 className="mb-2 text-xl font-bold">Related Tools</h2>
              <div className="space-y-4">
                <div className="rounded-lg border border-[#252a36] bg-[#161b24] p-4">
                  <h3 className="mb-2 text-lg font-medium">Orderbook Depth</h3>
                  <p className="mb-2 text-gray-300">
                    View orderbook depth for a different market perspective
                  </p>
                  <Link
                    href="/realtime-volume"
                    className="block rounded-md bg-green-700 px-4 py-2 text-center text-white transition-colors hover:bg-green-600"
                  >
                    Go to Orderbook Volume
                  </Link>
                </div>
                <div className="rounded-lg border border-[#252a36] bg-[#161b24] p-4">
                  <h3 className="mb-2 text-lg font-medium">Historical Data</h3>
                  <p className="mb-2 text-gray-300">
                    View and export previously collected data
                  </p>
                  <Link
                    href="/dbviewer"
                    className="block rounded-md bg-purple-700 px-4 py-2 text-center text-white transition-colors hover:bg-purple-600"
                  >
                    Go to Database Viewer
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BinanceTradeVolumeChart Component */}
        <BinanceTradeVolumeChart />
      </div>
    </div>
  );
}
