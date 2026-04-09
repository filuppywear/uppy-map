import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Uppy Thrifter Map | The world's thrift map",
  description:
    "Curated secondhand and vintage stores worldwide for thrifters, travelers, and locals. Unlock the live map and discover the best secondhand spots city by city.",
  applicationName: "Uppy",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "secondhand map",
    "vintage stores world",
    "thrift map",
    "vintage shopping",
    "flea market map",
    "secondhand stores worldwide",
  ],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/branding/favicon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/branding/favicon-512.png", sizes: "512x512" }],
  },
  openGraph: {
    title: "Uppy Thrifter Map",
    description:
      "The world's thrift map: curated secondhand and vintage stores, mapped city by city.",
    url: SITE_URL,
    siteName: "Uppy",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Uppy Thrifter Map",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Uppy Thrifter Map",
    description:
      "The world's thrift map: curated secondhand and vintage stores, mapped city by city.",
    images: ["/twitter-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#241b19",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
