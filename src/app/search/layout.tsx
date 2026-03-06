import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Apartments Near Hospitals",
  description:
    "Search proximity-scored apartments near hospitals. Filter by city, price, bedrooms, and distance to find the perfect housing for your healthcare assignment.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
