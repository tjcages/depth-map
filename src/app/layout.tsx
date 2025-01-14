import { seo } from "@/seo";
import { Analytics } from "@vercel/analytics/react";
import { Metadata, Viewport } from "next";
import { ViewTransitions } from "next-view-transitions";

import "@/styles/global.scss";

export const metadata: Metadata = seo;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransitions>
      <html lang="en">
        <body>
          <main>{children}</main>
          <Analytics />
        </body>
      </html>
    </ViewTransitions>
  );
}
