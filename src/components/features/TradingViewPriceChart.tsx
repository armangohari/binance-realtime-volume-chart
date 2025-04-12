"use client";

import { useEffect, useRef, useState } from "react";

// Add TradingView type declaration for window object
declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewPriceChartProps {
  symbol: string;
  timeframe?: string;
  className?: string;
  hideHeader?: boolean;
  hideVolume?: boolean;
}

// Mapping from our timeframe format to TradingView format
const timeframeToTVInterval = (timeframe: string): string => {
  // Convert our timeframe to TradingView interval
  const timeframeMap: Record<string, string> = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1h": "60",
    "4h": "240",
    "1d": "D",
    "1w": "W",
    "1M": "M",
    "1y": "Y",
  };

  return timeframeMap[timeframe] || "1";
};

// This defines the type for the TradingView widget instance
interface TradingViewWidgetInstance {
  remove: () => void;
}

export function TradingViewPriceChart({
  symbol,
  timeframe = "1m",
  className = "",
  hideHeader = false,
  hideVolume = false,
}: TradingViewPriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetInstance, setWidgetInstance] =
    useState<TradingViewWidgetInstance | null>(null);

  // Constants for styling - matching the dark theme
  const cardBgColor = "bg-[#0f1217]";
  const borderColor = "border-[#252830]";

  useEffect(() => {
    // Load the TradingView library
    const loadTradingViewLibrary = async () => {
      // If script is already loaded, use it
      if (typeof window.TradingView !== "undefined") {
        initializeWidget();
        return;
      }

      try {
        // Create script element and load the TradingView library
        const script = document.createElement("script");
        script.id = "tradingview-widget-script";
        script.src = "https://s3.tradingview.com/tv.js";
        script.async = true;

        // Initialize widget once script is loaded
        script.onload = () => initializeWidget();

        // Handle errors
        script.onerror = () => {
          console.error("Failed to load TradingView library");
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error("Error loading TradingView library:", error);
      }
    };

    // Initialize the TradingView widget
    const initializeWidget = () => {
      if (!containerRef.current || typeof window.TradingView === "undefined")
        return;

      // Clean up existing widget if it exists
      if (widgetInstance) {
        widgetInstance.remove();
        setWidgetInstance(null);
      }

      // Clear the container
      containerRef.current.innerHTML = "";

      // Create widget configuration
      const widgetOptions: any = {
        container_id: containerRef.current.id,
        symbol: `BINANCE:${symbol}`.toUpperCase(),
        theme: "dark",
        locale: "en",
        autosize: true,
        interval: timeframeToTVInterval(timeframe),
        timezone: "exchange",
        style: "1",
        toolbar_bg: "#161b24",
        enable_publishing: false,
        allow_symbol_change: false,
        save_image: true,
        hide_top_toolbar: true,
        hide_side_toolbar: false,
        studies: [],
        favorites: {
          intervals: ["1", "5", "15", "30", "60", "240"],
        },
        // Add a callback when chart is ready
        onChartReady: function () {
          if (hideVolume) {
            // This ensures we run after the widget is fully loaded
            console.log("Chart is ready, removing volume pane");
            // If there's a chart object exposed by TradingView, we can try to use it
            if ((window as any).tvWidget && (window as any).tvWidget.chart) {
              try {
                (window as any).tvWidget.chart.removeAllShapes();
                (window as any).tvWidget.chart.removeAllStudies();
              } catch (e) {
                console.error("Failed to remove studies:", e);
              }
            }
          }
        },
      };

      // Add additional options to hide volume if needed
      if (hideVolume) {
        widgetOptions.hide_volume = true;
        widgetOptions.loading_screen = { backgroundColor: "#0f1217" };

        // Attempt to set various properties that might hide volume
        widgetOptions.overrides = {
          "paneProperties.legendProperties.showVolume": false,
          "paneProperties.showVolume": false,
          "scalesProperties.showVolume": false,
          volumePaneSize: "tiny",
          "mainSeriesProperties.showVolume": false,
          "scalesProperties.showVolumeSeparately": false,
        };

        // Set volume colors to transparent
        widgetOptions.studies_overrides = {
          "volume.volume.color.0": "rgba(0,0,0,0)",
          "volume.volume.color.1": "rgba(0,0,0,0)",
          "volume.volume.transparency": 100,
          "volume.show": false,
          "volume.options.showStudyArguments": false,
          "volume.options.showLastValue": false,
        };

        // Don't show any indicators by default
        widgetOptions.drawings_access = {
          type: "black",
          tools: [{ name: "volume" }],
        };
      }

      // Create new widget instance
      const widget = new window.TradingView.widget(widgetOptions);

      // Store widget instance for cleanup
      setWidgetInstance(widget as unknown as TradingViewWidgetInstance);

      // Add event listener to hide volume panel after widget is loaded
      if (hideVolume && containerRef.current) {
        const hideVolumePanel = () => {
          if (containerRef.current) {
            // Find and hide any volume panes
            const volumePanes =
              containerRef.current.querySelectorAll(".tv-volumepane");
            volumePanes.forEach((pane) => {
              if (pane instanceof HTMLElement) {
                pane.style.display = "none";
              }
            });

            // Try to find and remove volume via class names
            const volumeElements =
              containerRef.current.querySelectorAll('[class*="volume"]');
            volumeElements.forEach((element) => {
              if (element instanceof HTMLElement) {
                element.style.display = "none";
              }
            });
          }
        };

        // Try multiple times as the widget loads asynchronously
        setTimeout(hideVolumePanel, 1000);
        setTimeout(hideVolumePanel, 2000);
        setTimeout(hideVolumePanel, 3000);
      }
    };

    // Load the library
    loadTradingViewLibrary();

    // Cleanup function
    return () => {
      // Check if the widgetInstance exists and the container ref is still valid
      if (widgetInstance && containerRef.current) {
        try {
          widgetInstance.remove();
        } catch (error) {
          console.error("Error removing TradingView widget:", error);
        }
        setWidgetInstance(null);
        // Optional: Clear the container to be sure
        // if (containerRef.current) {
        //  containerRef.current.innerHTML = "";
        // }
      }
    };
  }, [symbol, timeframe, hideVolume]);

  return (
    <div className={hideHeader ? "" : "flex flex-col gap-4"}>
      {!hideHeader && (
        <div
          className={`${cardBgColor} rounded-xl p-2 shadow-lg md:p-4 ${borderColor} border`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
            <div className="flex items-center">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#2962FF] md:h-2.5 md:w-2.5"></span>
              <span className="text-sm font-medium text-slate-200 md:text-base">
                Price Chart
              </span>
            </div>
            <div className="text-sm text-slate-400">
              TradingView Powered Chart
            </div>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div
        ref={containerRef}
        id={`tradingview_${symbol}`}
        className={`h-[300px] w-full md:h-[400px] ${className} overflow-hidden rounded-xl ${borderColor} border`}
        data-testid="tradingview-chart"
      />
    </div>
  );
}
