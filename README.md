# Binance Realtime Volume Chart with Database Storage

This application collects and visualizes realtime orderbook data from Binance. It includes a persistent data collection mechanism that stores the data in an SQLite database.

## Features

- **Realtime Data Visualization**: View orderbook data from Binance in realtime
- **Data Persistence**: Store orderbook data in an SQLite database for historical analysis
- **Robust WebSocket Connection**: Automatic reconnection with exponential backoff
- **Connection Logging**: Track connection status and errors
- **Docker Support**: Easy deployment with Docker and docker-compose
- **Multiple Timeframes**: View and collect data in multiple timeframes (1s, 5s, 15s, 30s, 1m, 5m, 15m, 30m, 1h)
- **Multiple Symbols**: Support for BTC, ETH, SOL, XRP, DOGE, and ADA

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

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

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

## Data Collection

The application can collect data even when you're not actively viewing the charts:

1. Open the web interface and use the "Data Collector Controls" section
2. Select a timeframe for data collection
3. Click "Start Collection"
4. The data collector will run in the background and automatically reconnect if disconnected
5. The collected data is stored in `./data/binance_orderbook.db`

## Database Structure

The SQLite database contains two main tables:

1. `orderbook_data`: Stores the actual orderbook data with the following columns:
   - `id`: Primary key
   - `symbol`: Trading pair (e.g., btcusdt)
   - `timestamp`: Time in milliseconds since epoch
   - `timeframe`: The timeframe used for aggregation (e.g., 1s, 1m)
   - `buy_volume`: Total buy volume in this timeframe
   - `sell_volume`: Total sell volume in this timeframe
   - `event_time`: Binance event time
   - `created_at`: When the record was inserted

2. `connection_logs`: Tracks WebSocket connection events:
   - `id`: Primary key
   - `timestamp`: Time in milliseconds since epoch
   - `symbol`: Trading pair
   - `event`: Event type (connect, disconnect, error, reconnect_attempt)
   - `details`: Additional information about the event
   - `created_at`: When the record was inserted

## Accessing Historical Data

The collected data can be accessed through the API:

```
GET /api/orderbook?symbol=btcusdt&startTime=1682675901000&endTime=1682679501000&timeframe=1m
```

Parameters:
- `symbol`: The trading pair (required)
- `startTime`: Start timestamp in milliseconds (required)
- `endTime`: End timestamp in milliseconds (required)
- `timeframe`: Filter by timeframe (optional)

To get a list of available symbols:

```
GET /api/orderbook?action=symbols
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Binance API](https://github.com/binance/binance-spot-api-docs)
- [Lightweight Charts](https://www.tradingview.com/lightweight-charts/)
- [Next.js](https://nextjs.org/)
- [SQLite](https://www.sqlite.org/)
