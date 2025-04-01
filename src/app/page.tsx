import Link from "next/link";
import {
  MdShowChart,
  MdDownload,
  MdStorage,
  MdArrowForward,
  MdBolt,
  MdBarChart,
  MdTimer,
  MdDataUsage,
  MdQueryStats,
  MdFileDownload,
  MdTrackChanges,
} from "react-icons/md";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#060a10] via-[#0a101b] to-[#060a10] p-8 text-white">
      {/* Animated background elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[30rem] w-[30rem] animate-pulse rounded-full bg-blue-600/10 blur-3xl"></div>
        <div className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] animate-pulse rounded-full bg-purple-600/5 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-[30rem] w-[30rem] animate-pulse rounded-full bg-blue-600/10 blur-3xl"></div>
        <div className="absolute inset-0 bg-[#060a10]/50 backdrop-blur-3xl"></div>
      </div>

      {/* Header with enhanced typography and spacing */}
      <div className="animate-fade-in relative z-10 mb-20 space-y-6 text-center">
        <h1 className="animate-gradient-x bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl lg:text-7xl">
          Binance Data Analytics
        </h1>
        <p className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-gray-300 md:text-xl">
          Track, analyze, and visualize cryptocurrency market data with powerful
          tools
        </p>
      </div>

      {/* Card grid with enhanced spacing and typography */}
      <div className="animate-fade-in-up relative z-10 grid w-full max-w-7xl grid-cols-1 gap-8 px-4 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
        <Link
          href="/realtime-volume"
          className="group relative transform overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-600/80 to-blue-800/80 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          <div className="relative z-10 h-full rounded-2xl border border-[#252830] bg-[#0f1217]/90 p-8 transition-all duration-300 group-hover:border-blue-500/50 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <div className="flex h-full flex-col items-center space-y-6 text-center">
              <div className="mb-4 flex h-20 w-20 rotate-3 transform items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                <MdShowChart className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold transition-colors duration-300 group-hover:text-blue-300">
                Orderbook Volume
              </h2>
              <p className="text-base leading-relaxed text-gray-400 transition-colors duration-300 group-hover:text-gray-200">
                Monitor realtime orderbook depth and market pressure across
                different trading pairs
              </p>
              <div className="mt-auto pt-4">
                <span className="inline-flex items-center rounded-lg bg-blue-500/10 px-6 py-2.5 text-sm font-medium text-blue-400 transition-colors group-hover:bg-blue-500/20 group-hover:text-white">
                  View Charts
                  <MdArrowForward className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/trade-volume"
          className="group relative transform overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-cyan-600/80 to-cyan-800/80 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          <div className="relative z-10 h-full rounded-2xl border border-[#252830] bg-[#0f1217]/90 p-8 transition-all duration-300 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <div className="flex h-full flex-col items-center space-y-6 text-center">
              <div className="mb-4 flex h-20 w-20 rotate-3 transform items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 shadow-xl transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                <MdBarChart className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold transition-colors duration-300 group-hover:text-cyan-300">
                Trade Volume
              </h2>
              <p className="text-base leading-relaxed text-gray-400 transition-colors duration-300 group-hover:text-gray-200">
                Track actual executed trades and volume in real-time for
                accurate market activity
              </p>
              <div className="mt-auto pt-4">
                <span className="inline-flex items-center rounded-lg bg-cyan-500/10 px-6 py-2.5 text-sm font-medium text-cyan-400 transition-colors group-hover:bg-cyan-500/20 group-hover:text-white">
                  View Charts
                  <MdArrowForward className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/data-collector"
          className="group relative transform overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-green-600/80 to-green-800/80 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          <div className="relative z-10 h-full rounded-2xl border border-[#252830] bg-[#0f1217]/90 p-8 transition-all duration-300 group-hover:border-green-500/50 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <div className="flex h-full flex-col items-center space-y-6 text-center">
              <div className="mb-4 flex h-20 w-20 -rotate-3 transform items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700 shadow-xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                <MdDownload className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold transition-colors duration-300 group-hover:text-green-300">
                Data Collector
              </h2>
              <p className="text-base leading-relaxed text-gray-400 transition-colors duration-300 group-hover:text-gray-200">
                Monitor and control the data collection process that stores
                market data in the database
              </p>
              <div className="mt-auto pt-4">
                <span className="inline-flex items-center rounded-lg bg-green-500/10 px-6 py-2.5 text-sm font-medium text-green-400 transition-colors group-hover:bg-green-500/20 group-hover:text-white">
                  Manage Collection
                  <MdArrowForward className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/dbviewer"
          className="group relative transform overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-600/80 to-purple-800/80 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          <div className="relative z-10 h-full rounded-2xl border border-[#252830] bg-[#0f1217]/90 p-8 transition-all duration-300 group-hover:border-purple-500/50 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            <div className="flex h-full flex-col items-center space-y-6 text-center">
              <div className="mb-4 flex h-20 w-20 rotate-3 transform items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-xl transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                <MdStorage className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold transition-colors duration-300 group-hover:text-purple-300">
                Database Viewer
              </h2>
              <p className="text-base leading-relaxed text-gray-400 transition-colors duration-300 group-hover:text-gray-200">
                Explore and analyze the collected market data with table views
                and export options
              </p>
              <div className="mt-auto pt-4">
                <span className="inline-flex items-center rounded-lg bg-purple-500/10 px-6 py-2.5 text-sm font-medium text-purple-400 transition-colors group-hover:bg-purple-500/20 group-hover:text-white">
                  Explore Data
                  <MdArrowForward className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Footer section with enhanced spacing and typography */}
      <div className="animate-fade-in-up relative z-10 mt-24 max-w-4xl border-t border-gray-800/50 pt-16 text-center">
        <div className="rounded-3xl border border-gray-800/50 bg-[#0f1217]/70 p-10 shadow-2xl backdrop-blur-xl">
          <div className="mb-12">
            <h3 className="mb-6 bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-3xl font-bold text-transparent">
              About This Project
            </h3>
            <p className="text-lg leading-relaxed text-gray-300">
              This application collects and visualizes Binance orderbook data to
              help traders identify volume patterns and market pressure. The
              data collector runs in the background, saving data to a local
              SQLite database for historical analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-3">
            <div className="rounded-2xl border border-blue-500/10 bg-gradient-to-br from-blue-500/5 to-blue-700/5 p-6">
              <h4 className="mb-6 flex items-center text-xl font-semibold text-blue-400">
                <MdBolt className="mr-2 h-6 w-6" />
                Data Collection
              </h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start">
                  <MdDataUsage className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                  <span>WebSocket connections to Binance API</span>
                </li>
                <li className="flex items-start">
                  <MdBarChart className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                  <span>Real-time orderbook processing</span>
                </li>
                <li className="flex items-start">
                  <MdTimer className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                  <span>Data aggregation by timeframe</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-green-500/10 bg-gradient-to-br from-green-500/5 to-green-700/5 p-6">
              <h4 className="mb-6 flex items-center text-xl font-semibold text-green-400">
                <MdQueryStats className="mr-2 h-6 w-6" />
                Visualization
              </h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start">
                  <MdShowChart className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <span>Interactive volume charts</span>
                </li>
                <li className="flex items-start">
                  <MdBarChart className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <span>Buy/sell pressure analysis</span>
                </li>
                <li className="flex items-start">
                  <MdTimer className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <span>Multiple timeframe views</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-br from-purple-500/5 to-purple-700/5 p-6">
              <h4 className="mb-6 flex items-center text-xl font-semibold text-purple-400">
                <MdTrackChanges className="mr-2 h-6 w-6" />
                Analysis
              </h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start">
                  <MdStorage className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500" />
                  <span>Historical data browsing</span>
                </li>
                <li className="flex items-start">
                  <MdFileDownload className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500" />
                  <span>CSV data export</span>
                </li>
                <li className="flex items-start">
                  <MdDataUsage className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500" />
                  <span>Connection log tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center space-x-3 text-sm text-gray-500">
          <span>Built with</span>
          <span className="font-medium text-blue-400">Next.js</span>
          <span>•</span>
          <span className="font-medium text-cyan-400">Tailwind CSS</span>
          <span>•</span>
          <span className="font-medium text-green-400">SQLite</span>
        </div>
      </div>
    </main>
  );
}
