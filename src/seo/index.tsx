import { Metadata } from "next";

export const seo = {
  title: "Depth Scan",
  description: "",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "http://localhost:3000",
    title: "Depth Scan",
    description: "",
    images: [
      {
        url: "/preview.gif",
        width: 1600,
        height: 826,
        alt: "Depth Scan Preview"
      },
      {
        url: "/preview.png",
        width: 1600,
        height: 826,
        alt: "Depth Scan Preview"
      }
    ]
  },
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico"
    }
  ]
} as Metadata;
