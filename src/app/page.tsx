import { LayoutWrapper } from "@/components/ui/layout-wrapper";
import Link from "next/link";
import {
  MdArrowForward,
  MdBarChart,
  MdBolt,
  MdDataUsage,
  MdDownload,
  MdFileDownload,
  MdQueryStats,
  MdShowChart,
  MdStorage,
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
            <div className="animate-blob bg-primary/10 absolute right-1/3 top-0 h-96 w-96 rounded-full opacity-70 blur-3xl filter"></div>
            <div className="animation-delay-2000 animate-blob bg-success/10 absolute bottom-0 left-1/4 h-96 w-96 rounded-full opacity-70 blur-3xl filter"></div>
            <div className="animation-delay-4000 animate-blob bg-secondary/10 absolute right-1/4 top-1/3 h-96 w-96 rounded-full opacity-70 blur-3xl filter"></div>
          </div>
        </div>

        {/* Hero section */}
        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl space-y-5 text-center">
            <h1 className="animate-gradient-x from-primary via-success to-primary font-heading bg-gradient-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
              Binance Data Analytics
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              Track, analyze, and visualize cryptocurrency market data with
              powerful tools for better trading decisions.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/realtime-volume"
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/30 inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium shadow transition-colors focus:outline-none focus:ring-4"
              >
                View Charts
                <MdArrowForward className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/data-collector"
                className="border-input hover:bg-accent hover:text-accent-foreground focus:ring-primary/30 inline-flex items-center justify-center rounded-md border bg-background px-5 py-2.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-4"
              >
                Manage Collection
              </Link>
            </div>
          </div>

          {/* Feature cards */}
          <div className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/realtime-volume"
              className="border-border/40 bg-card hover:border-primary/50 group relative overflow-hidden rounded-lg border p-6 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="bg-primary/10 text-primary mb-5 flex h-12 w-12 items-center justify-center rounded-md">
                <MdShowChart className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-xl font-semibold tracking-tight">
                Orderbook Volume
              </h2>
              <p className="text-muted-foreground">
                Monitor realtime orderbook depth and market pressure across
                trading pairs.
              </p>
              <span className="text-primary mt-4 inline-flex items-center text-sm font-medium">
                View Charts
                <MdArrowForward className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/trade-volume"
              className="border-border/40 bg-card hover:border-primary/50 group relative overflow-hidden rounded-lg border p-6 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="bg-primary/10 text-primary mb-5 flex h-12 w-12 items-center justify-center rounded-md">
                <MdBarChart className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-xl font-semibold tracking-tight">
                Trade Volume
              </h2>
              <p className="text-muted-foreground">
                Track actual executed trades and volume in real-time for
                accurate market activity.
              </p>
              <span className="text-primary mt-4 inline-flex items-center text-sm font-medium">
                View Charts
                <MdArrowForward className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/data-collector"
              className="border-border/40 bg-card hover:border-primary/50 group relative overflow-hidden rounded-lg border p-6 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="bg-primary/10 text-primary mb-5 flex h-12 w-12 items-center justify-center rounded-md">
                <MdDownload className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-xl font-semibold tracking-tight">
                Data Collector
              </h2>
              <p className="text-muted-foreground">
                Monitor and control the data collection process that stores
                market data in the database.
              </p>
              <span className="text-primary mt-4 inline-flex items-center text-sm font-medium">
                Manage Collection
                <MdArrowForward className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/dbviewer"
              className="border-border/40 bg-card hover:border-primary/50 group relative overflow-hidden rounded-lg border p-6 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="bg-primary/10 text-primary mb-5 flex h-12 w-12 items-center justify-center rounded-md">
                <MdStorage className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-xl font-semibold tracking-tight">
                Database Viewer
              </h2>
              <p className="text-muted-foreground">
                Explore and analyze the collected market data with table views
                and export options.
              </p>
              <span className="text-primary mt-4 inline-flex items-center text-sm font-medium">
                Explore Data
                <MdArrowForward className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>

          {/* About section */}
          <div className="border-border/40 bg-card mx-auto mt-24 max-w-5xl rounded-lg border p-8 shadow-sm md:p-10">
            <h2 className="mb-6 text-center text-3xl font-bold tracking-tight">
              About This Project
            </h2>
            <p className="text-muted-foreground mb-10 text-center text-lg">
              This application collects and visualizes Binance orderbook data to
              help traders identify volume patterns and market pressure. The
              data collector runs in the background, saving data to a local
              SQLite database for historical analysis.
            </p>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="border-border/40 bg-card/50 rounded-lg border p-6">
                <h3 className="mb-4 flex items-center text-lg font-medium text-foreground">
                  <MdBolt className="text-primary mr-2 h-5 w-5" />
                  Data Collection
                </h3>
                <ul className="text-muted-foreground space-y-3 text-sm">
                  <li className="flex items-start">
                    <MdDataUsage className="text-primary mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>WebSocket to Binance API</span>
                  </li>
                  <li className="flex items-start">
                    <MdBarChart className="text-primary mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Real-time orderbook processing</span>
                  </li>
                  <li className="flex items-start">
                    <MdTimer className="text-primary mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Data aggregation by timeframe</span>
                  </li>
                </ul>
              </div>

              <div className="border-border/40 bg-card/50 rounded-lg border p-6">
                <h3 className="mb-4 flex items-center text-lg font-medium text-foreground">
                  <MdQueryStats className="text-primary mr-2 h-5 w-5" />
                  Visualization
                </h3>
                <ul className="text-muted-foreground space-y-3 text-sm">
                  <li className="flex items-start">
                    <MdShowChart className="text-primary mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Interactive volume charts</span>
                  </li>
                  <li className="flex items-start">
                    <MdBarChart className="text-primary mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Buy/sell pressure analysis</span>
                  </li>
                  <li className="flex items-start">
                    <MdTimer className="text-primary mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Multiple timeframe views</span>
                  </li>
                </ul>
              </div>

              <div className="border-border/40 bg-card/50 rounded-lg border p-6">
                <h3 className="mb-4 flex items-center text-lg font-medium text-foreground">
                  <MdTrackChanges className="text-primary mr-2 h-5 w-5" />
                  Analysis
                </h3>
                <ul className="text-muted-foreground space-y-3 text-sm">
                  <li className="flex items-start">
                    <MdStorage className="text-primary mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Historical data browsing</span>
                  </li>
                  <li className="flex items-start">
                    <MdFileDownload className="text-primary mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>CSV data export</span>
                  </li>
                  <li className="flex items-start">
                    <MdDataUsage className="text-primary mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Connection log tracking</span>
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
