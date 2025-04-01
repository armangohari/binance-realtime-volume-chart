"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DataCollectorControls from "../components/DataCollectorControls";
import { LayoutWrapper } from "../components/layout-wrapper";
import { MdDataset, MdOutlineErrorOutline, MdSettings } from "react-icons/md";

export default function DataCollectorPage() {
  return (
    <LayoutWrapper>
      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Data Collector Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Monitor and control the background data collection process
          </p>
        </div>

        <div className="border-border/40 bg-card mb-8 rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold tracking-tight">
            About Data Collection
          </h2>
          <p className="text-muted-foreground mb-6">
            This dashboard allows you to monitor and control the background data
            collection process. The collector connects to Binance WebSocket
            streams to capture orderbook data in real-time and stores it in a
            local SQLite database for later analysis.
          </p>
          <div className="bg-card/50 rounded-md p-4">
            <h3 className="mb-3 text-lg font-medium">Features</h3>
            <ul className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                  Start and stop data collection for multiple trading pairs
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Choose the timeframe for data aggregation</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Monitor connection status and error messages</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>View database statistics and collection metrics</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Data Collector Controls Component */}
        <div className="border-border/40 bg-card mb-8 rounded-lg border p-4 shadow-sm md:p-6">
          <DataCollectorControls />
        </div>

        <div className="border-border/40 bg-card rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold tracking-tight">
            Troubleshooting
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-card/50 rounded-md p-4">
              <div className="mb-3 flex items-center">
                <MdSettings className="text-primary mr-2 h-5 w-5" />
                <h3 className="font-medium">Connection Issues</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                If you experience connection issues, Binance might be limiting
                connections from your IP address. Try restarting the collector,
                reducing the number of symbols, or using a VPN.
              </p>
            </div>

            <div className="bg-card/50 rounded-md p-4">
              <div className="mb-3 flex items-center">
                <MdOutlineErrorOutline className="text-primary mr-2 h-5 w-5" />
                <h3 className="font-medium">Database Errors</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Database errors usually indicate issues with file permissions or
                disk space. Ensure that the application has write access to the{" "}
                <code className="text-primary">data</code> directory.
              </p>
            </div>

            <div className="bg-card/50 rounded-md p-4">
              <div className="mb-3 flex items-center">
                <MdDataset className="text-primary mr-2 h-5 w-5" />
                <h3 className="font-medium">Viewing Collected Data</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                You can view and export the collected data using the{" "}
                <Link href="/dbviewer" className="text-primary hover:underline">
                  Database Viewer
                </Link>{" "}
                or access the database directly at{" "}
                <code className="text-primary">data/binance_orderbook.db</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
