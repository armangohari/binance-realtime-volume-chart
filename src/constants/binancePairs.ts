/**
 * Common Binance trading pairs used throughout the application
 */

export const COMMON_BINANCE_PAIRS = [
  "btcusdt",
  "ethusdt",
  "solusdt",
  "xrpusdt",
  "dogeusdt",
  "adausdt",
];

/**
 * Formats a raw binance pair (e.g. "btcusdt") to a human-readable format (e.g. "BTC/USDT")
 */
export const formatPairName = (pair: string): string => {
  // Find if the pair ends with a known quote currency
  const quoteAssets = ["usdt", "usdc", "busd", "bnb", "btc", "eth"];

  for (const quote of quoteAssets) {
    if (pair.toLowerCase().endsWith(quote)) {
      const base = pair.slice(0, pair.length - quote.length);
      return `${base.toUpperCase()}/${quote.toUpperCase()}`;
    }
  }

  // If no known quote asset is found, try to split at a logical point (4 characters from end)
  return `${pair.slice(0, -4).toUpperCase()}/${pair.slice(-4).toUpperCase()}`;
};

/**
 * Available timeframes for charts (in seconds)
 */
export const TIMEFRAMES = {
  "1s": 1,
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};
