"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Building2, MapPin, Star, ArrowRight, Shield, Clock, TrendingUp } from "lucide-react";
import { SITE_TAGLINE } from "@/lib/constants";
import { HospitalSearch } from "@/components/search/HospitalSearch";
import Link from "next/link";
import type { Hospital } from "@/types";

interface MetroLink {
  slug: string;
  name: string;
}

export default function HomePage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [metros, setMetros] = useState<MetroLink[]>([]);

  useEffect(() => {
    fetch("/api/v1/hospitals?limit=100")
      .then((r) => r.json())
      .then((data) => setHospitals(data.data ?? []))
      .catch(() => {});
    fetch("/api/v1/metros")
      .then((r) => r.json())
      .then((data) => setMetros(data.data ?? []))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-900 to-brand-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Housing scored by{" "}
              <span className="text-emerald-400">commute time</span>{" "}
              to your hospital
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-200 max-w-2xl mx-auto">
              {SITE_TAGLINE} — Find apartments, houses, and furnished rentals near the hospitals where you work.
            </p>

            {/* Search */}
            <div className="mt-10 max-w-2xl mx-auto">
              <HospitalSearch
                hospitals={hospitals}
                onSelect={(hospital) => {
                  // metroSlug is added by the API response
                  const metroSlug = (hospital as unknown as { metroSlug?: string }).metroSlug;
                  if (metroSlug) {
                    router.push(`/city/${metroSlug}/${hospital.slug}`);
                  }
                }}
                placeholder="Search by hospital name (e.g., Vanderbilt, Houston Methodist...)"
              />
            </div>

            {/* Quick stats */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span><strong className="text-white">{hospitals.length || "50"}+</strong> hospitals indexed</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span><strong className="text-white">{metros.length || 3}</strong> metros</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-400" />
                <span>Proximity <strong className="text-white">scoring</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">
              Find housing optimized for your hospital commute in three steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              title="Pick your hospital"
              description="Search from our database of hospitals across 25+ major metros. We cover every major healthcare market."
              icon={Building2}
            />
            <StepCard
              number={2}
              title="See scored listings"
              description="Every listing gets a 0-100 proximity score based on drive time, distance, and shift-specific commute data."
              icon={TrendingUp}
            />
            <StepCard
              number={3}
              title="Move with confidence"
              description="Filter for furnished, short-term, pet-friendly and more. Click through to apply or book directly."
              icon={Shield}
            />
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900">Explore cities</h2>
            <p className="mt-3 text-slate-500">
              Browse hospitals and housing in major healthcare markets across the country.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {metros.map((metro) => (
              <Link
                key={metro.slug}
                href={`/city/${metro.slug}`}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden card-hover"
              >
                <div className="relative h-40 bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
                  <Image
                    src={`/images/cities/${metro.slug}.jpg`}
                    alt={metro.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <MapPin className="w-12 h-12 text-white/30 relative z-10" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                    {metro.name}
                  </h3>
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

      {/* For Healthcare Workers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Built for healthcare workers
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Whether you&apos;re a travel nurse starting a 13-week contract, a medical resident
                relocating for training, or a new hire at a hospital system — we help you find
                housing that makes your commute disappear.
              </p>
              <ul className="mt-6 space-y-3">
                <FeatureItem icon={Clock} text="Shift-aware commute scoring (day shift and night shift)" />
                <FeatureItem icon={Building2} text="Furnished filter for travel nurses and short-term stays" />
                <FeatureItem icon={Shield} text="Safety scores and neighborhood insights" />
                <FeatureItem icon={Star} text="Reviews from other healthcare workers" />
              </ul>
              <Link href="/search" className="btn-primary inline-block mt-8">
                Start searching
              </Link>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-brand-50 rounded-2xl p-8 flex items-center justify-center min-h-[320px]">
              <div className="text-center">
                <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-12 h-12 text-brand-700" />
                </div>
                <p className="text-2xl font-bold text-brand-800 font-mono">87</p>
                <p className="text-sm text-brand-600 mt-1">Proximity Score</p>
                <p className="text-xs text-slate-500 mt-2">8 min drive to Vanderbilt</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guides / Resources */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900">Guides &amp; Resources</h2>
            <p className="mt-3 text-slate-500">
              In-depth guides to help you find the right housing for your healthcare career.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/guides/travel-nurse-housing"
              className="group bg-white rounded-xl border border-slate-200 p-5 card-hover block"
            >
              <Clock className="w-6 h-6 text-brand-600 mb-2" />
              <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">Travel Nurse Housing Guide</h3>
              <p className="text-sm text-slate-500 mt-1">Stipends, furnished rentals, and neighborhoods.</p>
              <div className="flex items-center gap-1 mt-3 text-sm font-medium text-brand-700">
                <span>Read guide</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link
              href="/guides/best-cities-travel-nurses"
              className="group bg-white rounded-xl border border-slate-200 p-5 card-hover block"
            >
              <TrendingUp className="w-6 h-6 text-emerald-600 mb-2" />
              <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">Best Cities for Travel Nurses</h3>
              <p className="text-sm text-slate-500 mt-1">Compare metros by rent, hospitals, and more.</p>
              <div className="flex items-center gap-1 mt-3 text-sm font-medium text-brand-700">
                <span>See rankings</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link
              href="/guides/housing-near-teaching-hospitals"
              className="group bg-white rounded-xl border border-slate-200 p-5 card-hover block"
            >
              <Building2 className="w-6 h-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">Teaching Hospitals</h3>
              <p className="text-sm text-slate-500 mt-1">Housing for residents, fellows, and students.</p>
              <div className="flex items-center gap-1 mt-3 text-sm font-medium text-brand-700">
                <span>Read guide</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link
              href="/guides/pet-friendly-housing-near-hospitals"
              className="group bg-white rounded-xl border border-slate-200 p-5 card-hover block"
            >
              <Shield className="w-6 h-6 text-pink-600 mb-2" />
              <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">Pet-Friendly Housing</h3>
              <p className="text-sm text-slate-500 mt-1">Listings that welcome your furry companions.</p>
              <div className="flex items-center gap-1 mt-3 text-sm font-medium text-brand-700">
                <span>Read guide</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-900 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to find your next home?
          </h2>
          <p className="mt-4 text-blue-200 text-lg">
            Search by hospital and find housing scored by your actual commute.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/search"
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Find Housing Near Your Hospital
            </Link>
            <Link
              href="/map"
              className="text-blue-200 hover:text-white px-8 py-3 rounded-lg font-semibold border border-blue-700 hover:border-blue-500 transition-colors"
            >
              Explore the Map
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-brand-700" />
      </div>
      <div className="bg-brand-800 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-500 text-sm">{description}</p>
    </div>
  );
}

function FeatureItem({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-emerald-700" />
      </div>
      <span className="text-sm text-slate-600">{text}</span>
    </li>
  );
}
