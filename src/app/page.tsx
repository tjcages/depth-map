import { seo } from "@/seo";
import type { Metadata } from "next";

import { Home } from "@/components/home";

export default async function Page() {
  return <Home />;
}

export async function generateMetadata(): Promise<Metadata> {
  return seo;
}
