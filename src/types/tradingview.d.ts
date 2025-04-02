interface TradingViewWidget {
  new (config: {
    container_id: string;
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
    studies?: string[]; 
    favorites?: {
      intervals: string[];
    };
    hide_top_toolbar?: boolean;
    hide_side_toolbar?: boolean;
  }): Record<string, unknown>;
}

interface TradingView {
  widget: TradingViewWidget;
}

declare global {
  interface Window {
    TradingView: TradingView;
  }
}

export {};
