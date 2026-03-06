import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hospital & Apartment Map",
  description:
    "Interactive map of hospitals and nearby apartments. Visualize commute distances and find housing close to your workplace.",
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
