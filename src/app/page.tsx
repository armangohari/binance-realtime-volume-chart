import { Suspense } from "react";
import BinanceVolumeChart from "./components/BinanceVolumeChart";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Binance Realtime Volume Chart</h1>
      <div className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <Suspense
          fallback={
            <div className="w-full h-[500px] flex items-center justify-center">
              Loading chart...
            </div>
          }
        >
          <BinanceVolumeChart />
        </Suspense>
      </div>
    </main>
  );
}
