# Binance Realtime Volume Chart

A Next.js 15 application that displays real-time volume data from Binance in a histogram chart, showing buy and sell volume for cryptocurrencies.

## Features

- Real-time data from Binance via WebSocket connection
- Histogram chart displaying buy and sell volume
- Multiple timeframe options (1m, 5m, 15m, 30m, 1h)
- Multiple crypto pairs (BTC, ETH, BNB, SOL, XRP, DOGE)
- Responsive design with dark mode support

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- TailwindCSS v4
- Lightweight Charts (TradingView)
- WebSocket API for real-time data

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How It Works

The application connects to Binance's WebSocket API to fetch real-time orderbook data. It processes this data to calculate buy and sell volumes (price * quantity) and displays them in a histogram chart. The data is aggregated based on the selected timeframe.

- Green bars represent buy volume
- Red bars represent sell volume

The chart updates in real-time as new data comes in from Binance.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Binance API Documentation](https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md) - learn about Binance WebSocket streams.
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) - learn about the charting library.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js).
