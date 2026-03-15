import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import NavigationBar from "@/components/NavigationBar";
import MaintenanceBanner from "@/components/MaintenanceBanner";
import AuthProvider from "@/components/AuthProvider";
import MaintenanceGuard from "@/components/MaintenanceGuard";

import { Inter, JetBrains_Mono } from "next/font/google";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0c0c0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "CyberSentinel | Live Threat Feed",
  description: "Real-time cyber threat intelligence",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CyberSentinel",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${mono.variable} antialiased bg-[var(--background)] text-[var(--foreground)] min-h-screen pb-28 md:pb-0 font-sans transition-colors duration-300 relative selection:bg-neon-blue/30`}
      >
        {/* Global Tech Grid Background - Subtle Texture */}
        <div className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
        {/* Ambient Gradient Blobs */}
        <div className="fixed top-[-20%] right-[-10%] w-[50vw] h-[50vh] bg-neon-blue/5 rounded-full blur-[100px] z-[-1] pointer-events-none" />
        <div className="fixed bottom-[-20%] left-[-10%] w-[50vw] h-[50vh] bg-neon-purple/5 rounded-full blur-[100px] z-[-1] pointer-events-none" />

        <ThemeProvider>
          <AuthProvider>
            <MaintenanceGuard>
              <MaintenanceBanner />
              <NavigationBar />
              {children}
            </MaintenanceGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

