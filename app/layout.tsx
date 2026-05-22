import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "MotivateAI",
  description: "Your Autonomous Consistency Agent",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body className="md:pt-16 pb-20 md:pb-0">
        <Navigation />
        {children}
      </body>
    </html>
  );
}
