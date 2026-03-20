import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Building2, MapPin, Bed, Star, Phone, Globe, AlertCircle,
  GraduationCap, ArrowLeft, ExternalLink
} from "lucide-react";
import { getHospitalBySlug, getScoresForHospital, getMetroBySlug, getOtherHospitalsInMetro, getMarketDataNearHospital } from "@/lib/queries";
import { HospitalListings } from "@/components/hospital/HospitalListings";
import { RentMarketData } from "@/components/hospital/RentMarketData";
import { TrackHospitalView } from "@/components/analytics/TrackPageView";
import { formatNumber, formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 3600; // Revalidate hourly

interface HospitalPageProps {
  params: { slug: string; hospitalSlug: string };
}

export async function generateMetadata({ params }: HospitalPageProps): Promise<Metadata> {
  const hospital = await getHospitalBySlug(params.hospitalSlug);
  const metro = await getMetroBySlug(params.slug);
  if (!hospital || !metro) return {};
  const scoredListings = await getScoresForHospital(hospital.id);
  const prices = scoredListings.map(({ listing }) => listing.priceMonthly).filter(Boolean);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const parts = [
    `Find apartments near ${hospital.name}`,
    hospital.bedCount ? ` (${formatNumber(hospital.bedCount)} beds` : "",
    hospital.bedCount && hospital.traumaLevel ? `, ${hospital.traumaLevel}` : hospital.traumaLevel ? ` (${hospital.traumaLevel}` : "",
    hospital.bedCount || hospital.traumaLevel ? ")" : "",
    ".",
    scoredListings.length > 0
      ? ` ${scoredListings.length} proximity-scored listings${minPrice ? ` from ${formatPrice(minPrice)}/mo` : ""}.`
      : "",
  ].join("");
  return {
    title: `Housing Near ${hospital.name} | ${metro.name}`,
    description: parts,
    alternates: { canonical: `/city/${metro.slug}/${hospital.slug}` },
  };
}

export default async function HospitalPage({ params }: HospitalPageProps) {
  const { slug, hospitalSlug } = params;

  const [metro, hospital] = await Promise.all([
    getMetroBySlug(slug),
    getHospitalBySlug(hospitalSlug),
  ]);

  if (!hospital || !metro) {
    notFound();
  }

  const [scoredListings, otherHospitals] = await Promise.all([
    getScoresForHospital(hospital.id),
    getOtherHospitalsInMetro(hospital.metroId, hospital.id, 6),
  ]);

  const marketData = hospital.zipCode ? await getMarketDataNearHospital(hospital.zipCode) : null;

  // Compute listing stats
  const prices = scoredListings.map(({ listing }) => listing.priceMonthly).filter(Boolean);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const distances = scoredListings.map(({ score }) => score.straightLineMiles);
  const walkingDistance = distances.filter((d) => d <= 1).length;
  const drivingClose = distances.filter((d) => d > 1 && d <= 5).length;
  const drivingFar = distances.filter((d) => d > 5).length;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://housingnearhospitals.com" },
      { "@type": "ListItem", position: 2, name: metro.name, item: `https://housingnearhospitals.com/city/${slug}` },
      { "@type": "ListItem", position: 3, name: hospital.name, item: `https://housingnearhospitals.com/city/${slug}/${hospitalSlug}` },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    name: hospital.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: hospital.address,
      addressLocality: hospital.city,
      addressRegion: hospital.stateCode,
      postalCode: hospital.zipCode,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: hospital.location.lat,
      longitude: hospital.location.lng,
    },
    ...(hospital.phone && { telephone: hospital.phone }),
    ...(hospital.website && { url: hospital.website }),
    ...(hospital.bedCount && {
      numberOfBeds: hospital.bedCount,
    }),
    medicalSpecialty: hospital.hospitalType,
  };

  return (
    <div>
      <TrackHospitalView hospitalId={hospital.id} hospitalName={hospital.name} metroSlug={slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb + Hospital Header */}
      <section className="bg-gradient-to-b from-brand-900 to-brand-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/city/${slug}`}
            className="flex items-center gap-1.5 text-blue-300 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {metro.name} Hospitals
          </Link>

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Hospital satellite image */}
            {hospital.imageUrl && (
              <div className="w-full md:w-48 h-36 md:h-36 rounded-xl overflow-hidden relative flex-shrink-0">
                <Image
                  src={hospital.imageUrl}
                  alt={`Aerial view of ${hospital.name}`}
                  fill
                  unoptimized
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 192px"
                />
              </div>
            )}
            {/* Hospital info */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">{hospital.name}</h1>

              {hospital.systemName && (
                <p className="text-blue-200 mt-1">{hospital.systemName}</p>
              )}

              <div className="flex items-center gap-2 mt-3 text-sm text-blue-300">
                <MapPin className="w-4 h-4" />
                <span>{hospital.address}, {hospital.city}, {hospital.stateCode} {hospital.zipCode}</span>
              </div>

              {/* Meta badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="badge bg-white/10 text-white">{hospital.hospitalType}</span>
                {hospital.bedCount && (
                  <span className="badge bg-white/10 text-white flex items-center gap-1">
                    <Bed className="w-3 h-3" />
                    {formatNumber(hospital.bedCount)} beds
                  </span>
                )}
                {hospital.traumaLevel && (
                  <span className="badge bg-red-500/20 text-red-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {hospital.traumaLevel}
                  </span>
                )}
                {hospital.teachingStatus === "Major" && (
                  <span className="badge bg-purple-500/20 text-purple-200 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    Teaching Hospital
                  </span>
                )}
                {hospital.cmsOverallRating && (
                  <span className="badge bg-amber-500/20 text-amber-200 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {hospital.cmsOverallRating}/5 CMS Rating
                  </span>
                )}
              </div>

              {/* Contact */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                {hospital.phone && (
                  <a href={`tel:${hospital.phone}`} className="flex items-center gap-1.5 text-blue-200 hover:text-white">
                    <Phone className="w-4 h-4" />
                    {hospital.phone}
                  </a>
                )}
                {hospital.website && (
                  <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-200 hover:text-white">
                    <Globe className="w-4 h-4" />
                    Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Listing Stats Summary */}
      {scoredListings.length > 0 && (
        <section className="border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg px-4 py-3">
                <p className="text-2xl font-bold text-slate-900">{scoredListings.length}</p>
                <p className="text-sm text-slate-500">apartments within 15 miles</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-4 py-3">
                <p className="text-2xl font-bold text-slate-900">
                  {formatPrice(minPrice)} - {formatPrice(maxPrice)}
                </p>
                <p className="text-sm text-slate-500">monthly price range</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-4 py-3">
                <div className="flex gap-4 text-sm">
                  {walkingDistance > 0 && (
                    <div>
                      <span className="text-lg font-bold text-emerald-600">{walkingDistance}</span>
                      <span className="text-slate-500 ml-1">walking distance</span>
                    </div>
                  )}
                  {drivingClose > 0 && (
                    <div>
                      <span className="text-lg font-bold text-blue-600">{drivingClose}</span>
                      <span className="text-slate-500 ml-1">within 5 mi</span>
                    </div>
                  )}
                  {drivingFar > 0 && (
                    <div>
                      <span className="text-lg font-bold text-slate-600">{drivingFar}</span>
                      <span className="text-slate-500 ml-1">5-15 mi</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">distance distribution</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Rent Market Data */}
      {marketData && (
        <RentMarketData
          hospitalName={hospital.name}
          marketData={marketData}
          metroAvgRent1br={metro.avgRent1br}
        />
      )}

      {/* Listings */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Housing near {hospital.name}
            </h2>
            <span className="text-sm text-slate-500">
              {scoredListings.length} {scoredListings.length === 1 ? "listing" : "listings"}
            </span>
          </div>

          {scoredListings.length > 0 ? (
            <HospitalListings listings={scoredListings} hospitalId={hospital.id} />
          ) : (
            <div className="text-center py-16 bg-slate-50 rounded-xl">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No listings found near this hospital yet.</p>
              <p className="text-sm text-slate-400 mt-1">New listings are added weekly.</p>
            </div>
          )}
        </div>
      </section>

      {/* Other hospitals in metro */}
      {otherHospitals.length > 0 && (
        <section className="py-10 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Other hospitals in {metro.name}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherHospitals.map((h) => (
                <Link
                  key={h.id}
                  href={`/city/${slug}/${h.slug}`}
                  className="group bg-white rounded-xl border border-slate-200 p-4 card-hover block"
                >
                  <h3 className="font-semibold text-sm text-slate-900 group-hover:text-brand-700 transition-colors">
                    {h.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                    <span>{h.hospitalType}</span>
                    {h.bedCount && <span>{formatNumber(h.bedCount)} beds</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
