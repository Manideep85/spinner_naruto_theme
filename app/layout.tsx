import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naruto Chakra Spin Wheel | Single-Use Ninja Rewards",
  description: "Secure, open-source Naruto-themed single-use spinner application with server-side secret probabilities and QR scanner access.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-konoha-darkBg text-gray-100 min-h-screen font-ninja selection:bg-konoha-orange selection:text-black antialiased">
        {children}
      </body>
    </html>
  );
}
