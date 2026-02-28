import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Map Explorer",
  description: "Explore hospitals and housing on an interactive map. Find healthcare facilities and nearby rentals across 10 major metros.",
  alternates: { canonical: `${SITE_URL}/map` },
  openGraph: {
    title: "Map Explorer | Housing Near Hospitals",
    description: "Explore hospitals and housing on an interactive map. Find healthcare facilities and nearby rentals across 10 major metros.",
    url: `${SITE_URL}/map`,
  },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
