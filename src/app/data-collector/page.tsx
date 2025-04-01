"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DataCollectorControls from "../components/DataCollectorControls";

export default function DataCollectorPage() {
  return (
    <div className="min-h-screen bg-[#060a10] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Data Collector Dashboard</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="bg-[#0f1217] border border-[#252830] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">About Data Collection</h2>
          <p className="text-gray-300 mb-4">
            This dashboard allows you to monitor and control the background data
            collection process. The collector connects to Binance WebSocket
            streams to capture orderbook data in real-time and stores it in a
            local SQLite database for later analysis.
          </p>
          <div className="bg-[#161b24] border border-[#252a36] rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Features</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Start and stop data collection for multiple trading pairs</li>
              <li>Choose the timeframe for data aggregation</li>
              <li>Monitor connection status and error messages</li>
              <li>View database statistics and collection metrics</li>
            </ul>
          </div>
        </div>

        {/* Data Collector Controls Component */}
        <DataCollectorControls />

        <div className="bg-[#0f1217] border border-[#252830] rounded-xl p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Troubleshooting</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-1">Connection Issues</h3>
              <p className="text-gray-300">
                If you experience connection issues, Binance might be limiting
                connections from your IP address. Try restarting the collector,
                reducing the number of symbols, or using a VPN.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Database Errors</h3>
              <p className="text-gray-300">
                Database errors usually indicate issues with file permissions or
                disk space. Ensure that the application has write access to the{" "}
                <code>data</code> directory.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">
                Viewing Collected Data
              </h3>
              <p className="text-gray-300">
                You can view and export the collected data using the{" "}
                <Link
                  href="/dbviewer"
                  className="text-blue-400 hover:underline"
                >
                  Database Viewer
                </Link>{" "}
                or access the database directly at{" "}
                <code>data/binance_orderbook.db</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
