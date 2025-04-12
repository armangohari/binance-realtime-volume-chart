import { ThemeProvider } from "@/components/ui/theme-provider";
import { ReactQueryProvider } from "@/contexts/ReactQueryProvider";
import "@/styles/globals.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Binance Data Analytics",
  description: "Track, analyze, and visualize cryptocurrency market data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        // className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
        className={`min-h-screen bg-background font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            {children}

            {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
