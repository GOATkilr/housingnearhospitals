import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Search Housing Near Hospitals",
  description: "Search for apartments, houses, and furnished rentals near your hospital. Filter by price, bedrooms, proximity score, and more.",
  alternates: { canonical: `${SITE_URL}/search` },
  openGraph: {
    title: "Search Housing Near Hospitals",
    description: "Search for apartments, houses, and furnished rentals near your hospital. Filter by price, bedrooms, proximity score, and more.",
    url: `${SITE_URL}/search`,
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
