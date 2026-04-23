import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/components/theme/theme-provider";
import { CurrencyProvider } from "@/contexts/currency-context";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Personal finance tracking application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${poppins.className} min-h-full flex flex-col`}>
        <ThemeProvider>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
          <Toaster richColors position="top-right" theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}
