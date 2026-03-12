import Link from "next/link";
import { Building2, DollarSign, Users, MapPin, ArrowRight, HelpCircle, Star } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { getMetrosWithStats } from "@/lib/queries";
import { formatNumber, formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Best Cities for Travel Nurses 2026 | ${SITE_NAME}`,
  description:
    "Compare the best cities for travel nurses by housing cost, hospital density, and metro population. Data-driven rankings to help you pick your next assignment.",
  alternates: { canonical: "/guides/best-cities-travel-nurses" },
};

export const revalidate = 86400;

export default async function BestCitiesGuidePage() {
  const metros = await getMetrosWithStats();

  // Sort by a composite score: lower rent + higher hospital count = better
  const ranked = [...metros].sort((a, b) => {
    const scoreA =
      (a.hospitalCount * 2) +
      (a.listingCount / 10) -
      ((a.avgRent1br ?? 2000) / 500);
    const scoreB =
      (b.hospitalCount * 2) +
      (b.listingCount / 10) -
      ((b.avgRent1br ?? 2000) / 500);
    return scoreB - scoreA;
  });

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What makes a city good for travel nurses?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The best cities for travel nurses combine affordable housing, a high density of hospitals (more assignment options), reasonable cost of living, and a strong healthcare job market. Cities with major medical centers and teaching hospitals tend to offer the most opportunities.",
        },
      },
      {
        "@type": "Question",
        name: "Which cities pay travel nurses the most?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pay varies by specialty and demand, but cities with higher costs of living typically offer higher stipends. However, the best overall value often comes from cities where pay is moderate but housing costs are low, maximizing your take-home savings.",
        },
      },
      {
        "@type": "Question",
        name: "How do I choose between cities for my next assignment?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Consider housing costs relative to your stipend, the number of hospitals (for extension or moonlighting options), commute times, climate preferences, and proximity to family. Our rankings weight affordability and hospital density to help you compare objectively.",
        },
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="bg-gradient-to-b from-brand-900 to-brand-800 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">
            Best Cities for Travel Nurses (2026)
          </h1>
          <p className="mt-4 text-blue-200 text-lg">
            Data-driven rankings of {ranked.length} metros by housing
            affordability, hospital density, and opportunity.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Intro */}
          <div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Choosing your next travel nursing assignment? The city you pick
              matters as much as the hospital. Housing costs, the number of
              nearby hospitals for moonlighting, and overall quality of life all
              affect your experience. We ranked every metro in our database using
              a composite score that weighs hospital density, available listings,
              and rental affordability.
            </p>
          </div>

          {/* Rankings Table */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Metro Rankings
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-3 pr-4 font-semibold text-slate-500">
                      Rank
                    </th>
                    <th className="py-3 pr-4 font-semibold text-slate-500">
                      Metro
                    </th>
                    <th className="py-3 pr-4 font-semibold text-slate-500">
                      Hospitals
                    </th>
                    <th className="py-3 pr-4 font-semibold text-slate-500">
                      Listings
                    </th>
                    <th className="py-3 pr-4 font-semibold text-slate-500">
                      Avg 1BR Rent
                    </th>
                    <th className="py-3 pr-4 font-semibold text-slate-500">
                      Population
                    </th>
                    <th className="py-3 font-semibold text-slate-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((metro, i) => (
                    <tr
                      key={metro.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 pr-4">
                        <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        <Link
                          href={`/city/${metro.slug}`}
                          className="hover:text-brand-700 transition-colors"
                        >
                          {metro.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {metro.hospitalCount}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {metro.listingCount}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {metro.avgRent1br
                          ? formatPrice(metro.avgRent1br)
                          : "--"}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {metro.metroPop
                          ? formatNumber(metro.metroPop)
                          : "--"}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/city/${metro.slug}`}
                          className="text-brand-700 hover:text-brand-800 font-medium flex items-center gap-1"
                        >
                          View
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Metro Cards (top 6) */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Top Metros at a Glance
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ranked.slice(0, 6).map((metro, i) => (
                <Link
                  key={metro.id}
                  href={`/city/${metro.slug}`}
                  className="group bg-white rounded-xl border border-slate-200 p-5 card-hover block"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                      {metro.name}
                    </h3>
                  </div>
                  <div className="space-y-1 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {metro.hospitalCount} hospitals
                    </div>
                    {metro.avgRent1br && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {formatPrice(metro.avgRent1br)}/mo avg rent
                      </div>
                    )}
                    {metro.metroPop && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {formatNumber(metro.metroPop)} metro pop
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-brand-600" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "What makes a city good for travel nurses?",
                  a: "The best cities combine affordable housing, a high density of hospitals (more assignment options), reasonable cost of living, and a strong healthcare job market. Cities with major medical centers and teaching hospitals tend to offer the most opportunities.",
                },
                {
                  q: "Which cities pay travel nurses the most?",
                  a: "Pay varies by specialty and demand, but cities with higher costs of living typically offer higher stipends. The best overall value often comes from cities where pay is moderate but housing costs are low, maximizing your take-home savings.",
                },
                {
                  q: "How do I choose between cities for my next assignment?",
                  a: "Consider housing costs relative to your stipend, the number of hospitals (for extension or moonlighting options), commute times, climate preferences, and proximity to family. Our rankings weight affordability and hospital density to help you compare.",
                },
              ].map((faq) => (
                <div
                  key={faq.q}
                  className="bg-white rounded-xl border border-slate-200 p-5"
                >
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm">
                    {faq.q}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-brand-50 rounded-xl p-6 text-center">
            <Star className="w-8 h-8 text-brand-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Ready to find housing?
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Search by hospital and see proximity-scored listings.
            </p>
            <Link href="/search" className="btn-primary inline-block text-sm">
              Start Searching
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
