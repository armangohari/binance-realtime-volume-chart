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
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-medium">Features</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">Real-time Monitoring</li>
              <li className="text-muted-foreground">Price Analysis</li>
              <li className="text-muted-foreground">Volume Tracking</li>
              <li className="text-muted-foreground">Custom Timeframes</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-medium">About</h3>
            <p className="text-muted-foreground max-w-xs text-sm">
              This application visualizes Binance trading data to help traders
              identify volume patterns and market pressure in real-time.
            </p>
          </div>
        </div>
        <div className="border-border/40 mt-8 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-muted-foreground text-center text-sm md:text-left">
              &copy; {new Date().getFullYear()} Binance Analytics. All rights
              reserved.
            </p>
            <p className="text-muted-foreground text-center text-sm md:text-left">
              <span>Designed & Developed by </span>
              <a
                href="https://armangohari.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center hover:underline"
              >
                Arman Gohari
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
