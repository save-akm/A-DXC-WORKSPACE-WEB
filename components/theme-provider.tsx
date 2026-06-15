"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

// Landing page (/) uses .landing-midnight for its own dark scoping; only the
// login route needs a forced theme override from next-themes.
const FORCED_DARK_PATHS = ["/login"];

function isForcedDarkPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return FORCED_DARK_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname();
  const forcedTheme = isForcedDarkPath(pathname) ? "dark" : props.forcedTheme;

  return (
    <NextThemesProvider {...props} forcedTheme={forcedTheme}>
      {children}
    </NextThemesProvider>
  );
}
