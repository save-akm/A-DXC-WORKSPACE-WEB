import type { Metadata } from "next";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import { fontLocalTh, fontLocalEn } from "./fonts";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemePresetProvider } from "@/components/theme-preset-provider";
import { AuthProvider } from "@/components/auth-provider";
import { SocketProvider } from "@/components/socket";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "A-DXC Workspace",
  description: "Advanced Next.js App with 3D and Animations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontLocalEn.variable} ${fontLocalTh.variable} antialiased`}
      suppressHydrationWarning
      data-theme="light"
    >
      <body className="min-h-screen">
        {/* reducedMotion="user" makes every Framer `motion` component respect
            prefers-reduced-motion automatically; per-component guards cover the
            GSAP / imperative / 3D motion Framer can't see. */}
        <MotionConfig reducedMotion="user">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ThemePresetProvider>
              <TooltipProvider delayDuration={300}>
                <AuthProvider>
                  <SocketProvider>{children}</SocketProvider>
                </AuthProvider>
              </TooltipProvider>
              <ToastProvider />
            </ThemePresetProvider>
          </ThemeProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
