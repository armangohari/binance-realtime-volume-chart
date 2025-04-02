"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  MdBarChart,
  MdClose,
  MdHome,
  MdMenu,
  MdShowChart,
} from "react-icons/md";

const mainNav = [
  {
    name: "Home",
    href: "/",
    icon: <MdHome className="h-5 w-5" />,
  },
  {
    name: "Orderbook Volume",
    href: "/orderbook-volume",
    icon: <MdShowChart className="h-5 w-5" />,
  },
  {
    name: "Trade Volume",
    href: "/trade-volume",
    icon: <MdBarChart className="h-5 w-5" />,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-border/40 sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex md:hidden">
          <button
            className="text-muted-foreground inline-flex items-center justify-center rounded-md p-2 hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <MdClose className="h-6 w-6" />
            ) : (
              <MdMenu className="h-6 w-6" />
            )}
          </button>
        </div>
        <div className="flex flex-1 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <MdShowChart className="text-primary h-6 w-6" />
            <span className="inline-block font-bold">Binance Analytics</span>
          </Link>
          <nav className="hidden md:flex md:gap-6 lg:gap-10">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center text-sm font-medium transition-colors hover:text-foreground/80",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-foreground/60",
                )}
              >
                <span className="mr-1">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center space-x-1">
            <ThemeToggle />
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="container pb-4 md:hidden">
          <nav className="flex flex-col space-y-3">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "hover:bg-accent flex items-center rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                )}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
