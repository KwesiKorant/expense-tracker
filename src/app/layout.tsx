import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expense Tracker — Financial Ledger & Analytics",
  description: "High-performance financial ledger with atomic audit logs and 120 FPS compositor analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var isLow=(window.matchMedia('(prefers-reduced-transparency: reduce)').matches||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<4)||(navigator.deviceMemory&&navigator.deviceMemory<4)||(navigator.connection&&navigator.connection.saveData));document.documentElement.dataset.blurTier=isLow?'low':'high';}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
