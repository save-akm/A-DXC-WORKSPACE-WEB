"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  
  // To avoid hydration mismatch, wait for mounted
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  
  if (!mounted) {
    return <div className="w-8 h-8 rounded-full border-blue-500/20 bg-blue-500/10"></div>; // Placeholder
  }

  const currentTheme = theme === 'system' ? resolvedTheme : theme;

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full w-7 h-7 2xl:w-8 2xl:h-8  border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 cursor-pointer overflow-hidden flex items-center justify-center relative"
      onClick={() => setTheme(currentTheme === "light" ? "dark" : "light")}
    >
      <Sun className="h-4 w-4 2xl:h-5 2xl:w-5 absolute rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 2xl:h-5 2xl:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
