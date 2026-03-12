import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, MapPin, DollarSign, Users, ArrowRight } from "lucide-react";
import {
  getMetrosByState,
  getActiveStateCodes,
  getStateName,
} from "@/lib/queries";
import { SITE_NAME } from "@/lib/constants";
import { formatNumber, formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 3600;

interface StatePageProps {
  params: { stateCode: string };
}

export async function generateStaticParams() {
  const codes = await getActiveStateCodes();
  return codes.map((stateCode) => ({ stateCode }));
}

export async function generateMetadata({
  params,
}: StatePageProps): Promise<Metadata> {
  const stateName = getStateName(params.stateCode);
  const metros = await getMetrosByState(params.stateCode);
  if (metros.length === 0) return {};
  const totalHospitals = metros.reduce((sum, m) => sum + m.hospitalCount, 0);
  return {
    title: `Housing Near Hospitals in ${stateName} | ${SITE_NAME}`,
    description: `Find housing near hospitals in ${stateName}. ${metros.length} metro${metros.length > 1 ? "s" : ""}, ${totalHospitals}+ hospitals with proximity-scored listings for healthcare workers.`,
    alternates: { canonical: `/state/${params.stateCode}` },
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const { stateCode } = params;
  const metros = await getMetrosByState(stateCode);

  if (metros.length === 0) {
    notFound();
  }

  const stateName = getStateName(stateCode);
  const totalHospitals = metros.reduce((sum, m) => sum + m.hospitalCount, 0);
  const rents = metros.map((m) => m.avgRent1br).filter(Boolean) as number[];
  const minRent = rents.length > 0 ? Math.min(...rents) : null;
  const maxRent = rents.length > 0 ? Math.max(...rents) : null;

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Housing Near Hospitals in ${stateName}`,
    numberOfItems: metros.length,
    itemListElement: metros.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.name,
      url: `https://housingnearhospitals.com/city/${m.slug}`,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://housingnearhospitals.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: stateName,
        item: `https://housingnearhospitals.com/state/${stateCode}`,
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-900 to-brand-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-blue-300 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span>{stateName}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold">
            Housing Near Hospitals in {stateName}
          </h1>

          <div className="mt-8 flex flex-wrap gap-6">
            <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-white font-semibold">{metros.length}</p>
                <p className="text-blue-300 text-xs">
                  Metro{metros.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-white font-semibold">{totalHospitals}+</p>
                <p className="text-blue-300 text-xs">Hospitals</p>
              </div>
            </div>
            {minRent && maxRent && (
              <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-white font-semibold">
                    {formatPrice(minRent)}
                    {minRent !== maxRent ? ` - ${formatPrice(maxRent)}` : ""}
                  </p>
                  <p className="text-blue-300 text-xs">Avg 1BR Rent Range</p>
                </div>
              </div>
            )}
          </div>

          <p className="mt-6 text-blue-200 text-sm leading-relaxed max-w-2xl">
            Browse {totalHospitals}+ hospitals across {metros.length} metro
            {metros.length > 1 ? " areas" : ""} in {stateName}. Every listing is
            scored by commute time to help healthcare workers find housing close
            to their workplace.
          </p>
        </div>
      </section>

      {/* Metro Cards */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Metros in {stateName}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metros.map((metro) => (
              <Link
                key={metro.id}
                href={`/city/${metro.slug}`}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden card-hover"
              >
                <div className="h-32 bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-white/30" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                    {metro.name}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {metro.hospitalCount} hospitals
                    </span>
                    {metro.metroPop && (
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {formatNumber(metro.metroPop)}
                      </span>
                    )}
                    {metro.avgRent1br && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatPrice(metro.avgRent1br)}/mo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-4 text-sm font-medium text-brand-700">
                    <span>Browse hospitals</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guides CTA */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Guides for {stateName}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/guides/best-cities-travel-nurses"
              className="bg-white rounded-xl border border-slate-200 p-5 card-hover block"
            >
              <h3 className="font-semibold text-slate-900">
                Best Cities for Travel Nurses
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Compare metros by rent, hospital density, and more.
              </p>
            </Link>
            <Link
              href="/guides/travel-nurse-housing"
              className="bg-white rounded-xl border border-slate-200 p-5 card-hover block"
            >
              <h3 className="font-semibold text-slate-900">
                Travel Nurse Housing Guide
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Tips on stipends, furnished rentals, and neighborhoods.
              </p>
            </Link>
            <Link
              href="/guides/housing-near-teaching-hospitals"
              className="bg-white rounded-xl border border-slate-200 p-5 card-hover block"
            >
              <h3 className="font-semibold text-slate-900">
                Housing Near Teaching Hospitals
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Find housing near major teaching hospitals.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
