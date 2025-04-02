# Binance Realtime Volume Chart with Database Storage

A powerful Next.js application for collecting, analyzing, and visualizing real-time orderbook data from Binance. Built with modern web technologies and a focus on user experience.

## Features

### Real-time Trading Data
- **Live Trading Data**: Real-time streaming of trading data from Binance via WebSocket
- **Multiple Timeframes**: Support for various timeframes (1s, 5s, 15s, 30s, 1m, 5m, 15m, 30m, 1h)
- **Multiple Trading Pairs**: Support for major cryptocurrencies (BTC, ETH, SOL, XRP, DOGE, ADA)

### Visualization & Analysis
- **Interactive Charts**: Real-time volume visualization using TradingView's Lightweight Charts
- **Buy/Sell Pressure**: Clear visualization of market pressure through volume analysis
- **Multiple Views**: Different chart types for various analysis needs
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### User Interface
- **Modern Design**: Clean, minimalist interface with dark/light mode support
- **Intuitive Controls**: Easy-to-use chart controls
- **Real-time Updates**: Live updates of market data

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- Docker and docker-compose (for containerized deployment)

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/binance-realtime-volume-chart.git
   cd binance-realtime-volume-chart
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory (optional):
   ```env
   NEXT_PUBLIC_BINANCE_WS_URL=wss://stream.binance.com:9443/ws
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Deployment with Docker

1. Build and start the container:
   ```bash
   docker-compose up -d
   ```

2. Access the application at [http://localhost:3000](http://localhost:3000)

3. To stop the container:
   ```bash
   docker-compose down
   ```

## Project Structure

```
binance-realtime-volume-chart/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── realtime-volume/   # Real-time chart page
│   │   └── trade-volume/      # Trade volume page
│   ├── components/            # React components
│   ├── lib/                   # Utility functions and services
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
└── docker/                    # Docker configuration
```

## API Endpoints

### Historical Data
```
GET /api/orderbook?symbol=btcusdt&startTime=1682675901000&endTime=1682679501000&timeframe=1m
```

Parameters:
- `symbol`: The trading pair (required)
- `startTime`: Start timestamp in milliseconds (required)
- `endTime`: End timestamp in milliseconds (required)
- `timeframe`: Filter by timeframe (optional)

### Available Symbols
```
GET /api/orderbook?action=symbols
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Issues**
   - Check your internet connection
   - Verify the Binance API is accessible
   - Ensure your firewall isn't blocking WebSocket connections

2. **Chart Performance**
   - Reduce the number of data points displayed
   - Try a different browser if animations are slow
   - Consider using a device with better graphics capabilities for complex charts

3. **Memory Usage**
   - Monitor browser memory usage
   - Adjust chart update frequency if needed
   - Close other tabs or applications to free up resources

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Binance API](https://github.com/binance/binance-spot-api-docs)
- [Lightweight Charts](https://www.tradingview.com/lightweight-charts/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Icons](https://react-icons.github.io/react-icons/)
