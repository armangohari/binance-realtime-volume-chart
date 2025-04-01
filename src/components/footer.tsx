import Link from "next/link";
import { MdShowChart } from "react-icons/md";

export function Footer() {
  return (
    <footer className="border-border/40 border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="mb-4 flex items-center space-x-2">
              <MdShowChart className="text-primary h-6 w-6" />
              <span className="inline-block font-bold">Binance Analytics</span>
            </Link>
            <p className="text-muted-foreground mt-4 max-w-xs text-sm">
              Track, analyze, and visualize cryptocurrency market data with
              powerful tools.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-medium">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/realtime-volume"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Orderbook Volume
                </Link>
              </li>
              <li>
                <Link
                  href="/trade-volume"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Trade Volume
                </Link>
              </li>
              <li>
                <Link
                  href="/data-collector"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Data Collector
                </Link>
              </li>
              <li>
                <Link
                  href="/dbviewer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Database Viewer
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-medium">Features</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">Real-time Monitoring</li>
              <li className="text-muted-foreground">Price Analysis</li>
              <li className="text-muted-foreground">Volume Tracking</li>
              <li className="text-muted-foreground">Data Export</li>
              <li className="text-muted-foreground">Custom Timeframes</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-medium">About</h3>
            <p className="text-muted-foreground max-w-xs text-sm">
              This application collects and visualizes Binance orderbook data to
              help traders identify volume patterns and market pressure.
            </p>
          </div>
        </div>
        <div className="border-border/40 mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-muted-foreground text-center text-sm md:text-left">
            &copy; {new Date().getFullYear()} Binance Analytics. All rights
            reserved.
          </p>
          <p className="text-muted-foreground flex items-center text-sm">
            <span>Built with</span>
            <span className="mx-1 text-foreground">Next.js</span>
            <span>&middot;</span>
            <span className="mx-1 text-foreground">Tailwind CSS</span>
            <span>&middot;</span>
            <span className="mx-1 text-foreground">SQLite</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
