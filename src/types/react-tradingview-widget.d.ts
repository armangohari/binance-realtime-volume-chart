declare module "react-tradingview-widget" {
  interface TradingViewWidgetProps {
    symbol: string;
    theme?: string;
    locale?: string;
    autosize?: boolean;
    interval?: string;
    timezone?: string;
    style?: string;
    toolbar_bg?: string;
    enable_publishing?: boolean;
    allow_symbol_change?: boolean;
    save_image?: boolean;
    container_id?: string;
    studies?: string[];
  }

  const TradingViewWidget: React.FC<TradingViewWidgetProps>;
  export default TradingViewWidget;
}
