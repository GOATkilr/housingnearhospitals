import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2, MapPin, Bed, Star, Phone, Globe, AlertCircle,
  GraduationCap, ArrowLeft, ExternalLink
} from "lucide-react";
import { getHospitalBySlug, getScoresForHospital, getAllHospitalSlugs } from "@/lib/queries";
import { LAUNCH_METROS } from "@/lib/constants";
import { ListingCard } from "@/components/listing/ListingCard";
import { formatNumber } from "@/lib/utils";
import type { Metadata } from "next";

interface HospitalPageProps {
  params: { slug: string; hospitalSlug: string };
}

export async function generateStaticParams() {
  const slugs = await getAllHospitalSlugs();
  return slugs.map((s) => ({
    slug: s.metroSlug,
    hospitalSlug: s.slug,
  }));
}

export async function generateMetadata({ params }: HospitalPageProps): Promise<Metadata> {
  const hospital = await getHospitalBySlug(params.hospitalSlug);
  const metro = LAUNCH_METROS.find((m) => m.slug === params.slug);
  if (!hospital || !metro) return {};
  return {
    title: `Housing Near ${hospital.name} | ${metro.name}`,
    description: `Find apartments and housing near ${hospital.name} in ${metro.name}. Proximity-scored listings for healthcare workers, travel nurses, and residents.`,
  };
}

export default async function HospitalPage({ params }: HospitalPageProps) {
  const { slug, hospitalSlug } = params;

  const metro = LAUNCH_METROS.find((m) => m.slug === slug);
  const hospital = await getHospitalBySlug(hospitalSlug);

  if (!hospital || !metro) {
    notFound();
  }

  const scoredListings = await getScoresForHospital(hospital.id);

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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {scoredListings.map(({ listing, score }) => (
                <ListingCard key={listing.id} listing={listing} score={score} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-50 rounded-xl">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No listings found near this hospital yet.</p>
              <p className="text-sm text-slate-400 mt-1">New listings are added weekly.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
