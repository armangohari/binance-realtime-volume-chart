import { LayoutWrapper } from "@/components/ui/layout-wrapper";
import Link from "next/link";
import {
  MdArrowForward,
  MdBarChart,
  MdBolt,
  MdDataUsage,
  MdQueryStats,
  MdShowChart,
  MdTimer,
  MdTrackChanges,
} from "react-icons/md";

export default function Home() {
  return (
    <LayoutWrapper>
      <div className="relative overflow-hidden py-16 sm:py-24">
        {/* Background effects */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="pointer-events-none">
            <div className="absolute right-1/3 top-0 h-96 w-96 animate-blob rounded-full bg-primary/10 opacity-70 blur-3xl filter"></div>
            <div className="animation-delay-2000 absolute bottom-0 left-1/4 h-96 w-96 animate-blob rounded-full bg-success/10 opacity-70 blur-3xl filter"></div>
            <div className="animation-delay-4000 absolute right-1/4 top-1/3 h-96 w-96 animate-blob rounded-full bg-secondary/10 opacity-70 blur-3xl filter"></div>
          </div>
        </div>

        {/* Hero section */}
        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl space-y-5 text-center">
            <h1 className="animate-gradient-x font-heading bg-gradient-to-r from-primary via-success to-primary bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
              Binance Data Analytics
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Visualize real-time Binance market data, analyze volume trends,
              and make more informed trading decisions.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/trade-price-volume"
                className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/30"
              >
                Analyze Live Trade Volume
                <MdArrowForward className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Feature cards */}
          <div className="mt-24 grid gap-6 sm:grid-cols-2">
            <Link
              href="/trade-price-volume"
              className="group relative overflow-hidden rounded-lg border border-border/40 bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <MdBarChart className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-xl font-semibold tracking-tight">
                Live Trade Volume
              </h2>
              <p className="text-muted-foreground">
                See price movements correlated with actual executed trades and
                net market pressure.
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                View Live Trade Volume
                <MdArrowForward className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/orderbook-volume"
              className="group relative overflow-hidden rounded-lg border border-border/40 bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <MdDataUsage className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-xl font-semibold tracking-tight">
                Live Orderbook Volume
              </h2>
              <p className="text-muted-foreground">
                See potential support and resistance levels by visualizing the
                live order book depth.
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                View Live Orderbook Chart
                <MdArrowForward className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>

          {/* About section */}
          <div className="mx-auto mt-24 max-w-5xl rounded-lg border border-border/40 bg-card p-8 shadow-sm md:p-10">
            <h2 className="mb-6 text-center text-3xl font-bold tracking-tight">
              About This Project
            </h2>
            <p className="mb-10 text-center text-lg text-muted-foreground">
              This application visualizes Binance trading data to help traders
              identify volume patterns and market pressure in real-time.
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-border/40 bg-card/50 p-6">
                <h3 className="mb-4 flex items-center text-lg font-medium text-foreground">
                  <MdBolt className="mr-2 h-5 w-5 text-primary" />
                  Data Streaming
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <MdDataUsage className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Direct WebSocket connection to Binance API</span>
                  </li>
                  <li className="flex items-start">
                    <MdBarChart className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Stream real-time trade and orderbook data</span>
                  </li>
                  <li className="flex items-start">
                    <MdTimer className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Adjustable timeframes for analysis</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-border/40 bg-card/50 p-6">
                <h3 className="mb-4 flex items-center text-lg font-medium text-foreground">
                  <MdQueryStats className="mr-2 h-5 w-5 text-primary" />
                  Visualization
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <MdShowChart className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Interactive charts for price and volume</span>
                  </li>
                  <li className="flex items-start">
                    <MdBarChart className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Clear visualization of net buy/sell pressure</span>
                  </li>
                  <li className="flex items-start">
                    <MdTimer className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Synchronized multi-timeframe views</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
