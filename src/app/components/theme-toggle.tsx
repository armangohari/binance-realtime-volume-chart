"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { MdOutlineLightMode, MdOutlineDarkMode } from "react-icons/md";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="border-input hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-10 w-10 items-center justify-center rounded-md border bg-background p-2.5 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1"
      aria-label="Toggle theme"
    >
      <MdOutlineLightMode className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MdOutlineDarkMode className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
