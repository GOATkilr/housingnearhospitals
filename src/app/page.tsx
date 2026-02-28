import type { Metadata } from "next";
import { SITE_NAME, SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/constants";
import { SITE_URL, generateWebSiteJsonLd, generateOrganizationJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import HomePageContent from "@/components/home/HomePageContent";

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={generateWebSiteJsonLd()} />
      <JsonLd data={generateOrganizationJsonLd()} />
      <HomePageContent />
    </>
  );
}
