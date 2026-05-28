import type { Metadata } from "next";
import "./globals.css";
import { fontLocalTh} from "./fonts";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemePresetProvider } from "@/components/theme-preset-provider";
import { AuthProvider } from "@/components/auth-provider";
import { SocketProvider } from "@/components/socket";
import { ToastProvider } from "@/components/ui/toast";

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
      className={`${fontLocalTh.className} antialiased`}
      suppressHydrationWarning
      data-theme="light"
    >
      <body className="min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ThemePresetProvider>
            <AuthProvider>
              <SocketProvider>{children}</SocketProvider>
            </AuthProvider>
            <ToastProvider />
          </ThemePresetProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
