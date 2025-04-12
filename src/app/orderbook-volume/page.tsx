"use client";

import OrderbookPriceVolumeChart from "@/components/features/OrderbookPriceVolumeChart";
import { LayoutWrapper } from "@/components/ui/layout-wrapper";

export default function RealtimeVolumePage() {
  return (
    <LayoutWrapper>
      {/* Directly render the chart component */}
      <OrderbookPriceVolumeChart />
    </LayoutWrapper>
  );
}
