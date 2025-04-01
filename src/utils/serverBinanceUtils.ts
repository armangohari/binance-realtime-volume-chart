"use server";

// Import the interface from binanceUtils
import { BinanceDepthUpdate } from "./binanceUtils";

/**
 * Process depth data from Binance WebSocket (server-side version)
 * @param data The depth update data from Binance
 * @returns Object containing calculated buy and sell volume
 */
export async function processDepthData(data: BinanceDepthUpdate): Promise<{
  buyVolume: number;
  sellVolume: number;
}> {
  let buyVolume = 0;
  let sellVolume = 0;

  // Process bids (buys)
  data.b.forEach(([price, quantity]) => {
    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);
    if (!isNaN(priceNum) && !isNaN(quantityNum) && quantityNum > 0) {
      buyVolume += priceNum * quantityNum;
    }
  });

  // Process asks (sells)
  data.a.forEach(([price, quantity]) => {
    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);
    if (!isNaN(priceNum) && !isNaN(quantityNum) && quantityNum > 0) {
      sellVolume += priceNum * quantityNum;
    }
  });

  return { buyVolume, sellVolume };
}
