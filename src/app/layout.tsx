import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Intelligence Survival - CIA Operations Simulation",
  description: "Experience CIA-style intelligence operations through immersive interactive missions. Master covert operations, make critical decisions, and survive complex geopolitical scenarios in this educational simulation game.",
  keywords: [
    "CIA simulation",
    "intelligence game",
    "spy operations",
    "tactical decisions",
    "mission simulation",
    "covert operations",
    "strategic gameplay",
    "intelligence training",
    "espionage simulation",
    "national security"
  ],
  authors: [{ name: "Intelligence Survival Team" }],
  creator: "Intelligence Survival",
  publisher: "Intelligence Survival",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://intelligence-survival.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://intelligence-survival.vercel.app",
    title: "Intelligence Survival - CIA Operations Simulation",
    description: "Experience CIA-style intelligence operations through immersive interactive missions. Master covert operations and survive complex geopolitical scenarios.",
    siteName: "Intelligence Survival",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Intelligence Survival - CIA Operations Simulation Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Intelligence Survival - CIA Operations Simulation",
    description: "Experience CIA-style intelligence operations through immersive interactive missions.",
    images: ["/og-image.png"],
    creator: "@IntelSurvival",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  category: "games",
  classification: "Educational Simulation Game",
  other: {
    "theme-color": "#00FF00",
    "application-name": "Intelligence Survival",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Intelligence Survival",
    "msapplication-TileColor": "#000000",
    "msapplication-config": "/browserconfig.xml",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
