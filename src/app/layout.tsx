import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { OrganizationStructuredData } from "@/components/product-structured-data";
import { AnalyticsScripts, SearchConsoleVerification } from "@/components/analytics-scripts";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

export const metadata: Metadata = {
  title: {
    default: "Modern E-commerce - Fashion & Lifestyle",
    template: "%s | Modern E-commerce",
  },
  description: "Discover traditional and contemporary fashion at Modern E-commerce. Shop sarees, salwar kameez, kurtas, gowns, lehengas, and menswear with nationwide delivery across Bangladesh.",
  keywords: ["e-commerce", "fashion", "saree", "salwar kameez", "kurtas", "gowns", "lehengas", "menswear", "Bangladesh", "online shopping"],
  authors: [{ name: "Modern E-commerce Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "SCommerce",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    title: "Modern E-commerce - Fashion & Lifestyle",
    description: "Discover traditional and contemporary fashion with nationwide delivery across Bangladesh",
    url: SITE_URL,
    siteName: "Modern E-commerce",
    type: "website",
    locale: "en_BD",
  },
  twitter: {
    card: "summary_large_image",
    title: "Modern E-commerce - Fashion & Lifestyle",
    description: "Discover traditional and contemporary fashion with nationwide delivery across Bangladesh",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <SearchConsoleVerification />
        <OrganizationStructuredData
          siteName="Modern E-commerce"
          siteUrl={SITE_URL}
          logo="/logo.svg"
          description="Modern e-commerce platform for fashion and lifestyle products"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AnalyticsScripts />
        <ServiceWorkerRegistration />
        {children}
        <Toaster />
        <SonnerToaster position="bottom-right" />
      </body>
    </html>
  );
}
