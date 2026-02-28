"use client";

import { useRouter } from "next/navigation";
import { Building2, MapPin, Star, ArrowRight, Shield, Clock, TrendingUp } from "lucide-react";
import { SITE_TAGLINE, LAUNCH_METROS, getMetroById } from "@/lib/constants";
import { SAMPLE_HOSPITALS } from "@/lib/sample-data";
import { HospitalSearch } from "@/components/search/HospitalSearch";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              Housing scored by{" "}
              <span className="text-emerald-400">commute time</span>{" "}
              to your hospital
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              {SITE_TAGLINE} — Find apartments, houses, and furnished rentals near the hospitals where you work.
            </p>

            {/* Floating Search Container */}
            <div className="mt-10 max-w-2xl mx-auto">
              <div className="bg-white rounded-brand shadow-xl border border-gray-100 p-3">
                <p className="text-[10px] uppercase tracking-widest text-brand-slate font-semibold text-left px-2 mb-1.5">
                  Hospital
                </p>
                <HospitalSearch
                  hospitals={SAMPLE_HOSPITALS}
                  onSelect={(hospital) => {
                    const metro = getMetroById(hospital.metroId);
                    if (metro) {
                      router.push(`/city/${metro.slug}/${hospital.slug}`);
                    }
                  }}
                  placeholder="Search by hospital name (e.g., Vanderbilt, Houston Methodist...)"
                />
              </div>

              {/* Quick filter tags */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {["Travel nurse friendly", "Furnished", "Pet friendly", "Short-term lease"].map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-xs px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span><strong className="text-white">{SAMPLE_HOSPITALS.length}+</strong> hospitals indexed</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span><strong className="text-white">{LAUNCH_METROS.length}</strong> metros</span>
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
      <section className="py-section bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="mt-3 text-brand-slate max-w-xl mx-auto">
              Find housing optimized for your hospital commute in three steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              title="Pick your hospital"
              description="Search from our database of hospitals across 10 major metros. We know every facility."
              icon={Building2}
            />
            <StepCard
              title="See scored listings"
              description="Every listing gets a 0-100 proximity score based on drive time, distance, and shift-specific commute data."
              icon={TrendingUp}
            />
            <StepCard
              title="Move with confidence"
              description="Filter for furnished, short-term, pet-friendly and more. Click through to apply or book directly."
              icon={Shield}
            />
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-section bg-brand-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold">Explore cities</h2>
            <p className="mt-3 text-brand-slate">
              Find housing in {LAUNCH_METROS.length} major healthcare markets.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {LAUNCH_METROS.map((metro) => (
              <Link
                key={metro.slug}
                href={`/city/${metro.slug}`}
                className="group bg-white rounded-brand border border-gray-200 overflow-hidden card-hover"
              >
                {/* Placeholder gradient */}
                <div className="h-40 bg-gradient-to-br from-brand-navy to-[#1a3a5c] flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-white/30" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold group-hover:text-brand-blue transition-colors">
                    {metro.name}
                  </h3>
                  <p className="text-sm text-brand-slate mt-1">{metro.tagline}</p>
                  <div className="flex items-center gap-1 mt-4 text-sm font-medium text-brand-blue">
                    <span>{metro.hospitalCount}+ hospitals</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For Healthcare Workers */}
      <section className="py-section bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold">
                Built for healthcare workers
              </h2>
              <p className="mt-4 text-brand-slate leading-relaxed">
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
            <div className="bg-brand-light rounded-2xl p-8 flex items-center justify-center min-h-[320px]">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-12 h-12 text-brand-blue" />
                </div>
                <p className="text-2xl font-bold text-brand-navy font-mono">87</p>
                <p className="text-sm text-brand-blue mt-1">Proximity Score</p>
                <p className="text-xs text-brand-slate mt-2">8 min drive to Vanderbilt</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-navy py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to find your next home?
          </h2>
          <p className="mt-4 text-gray-300 text-lg">
            Search by hospital and find housing scored by your actual commute.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/search"
              className="bg-brand-blue hover:bg-[#35689d] text-white px-8 py-3 rounded-brand font-semibold transition-colors"
            >
              Find Housing Near Your Hospital
            </Link>
            <Link
              href="/map"
              className="text-white/80 hover:text-white px-8 py-3 rounded-brand font-semibold border border-white/30 hover:bg-white/10 transition-colors"
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
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-brand-light rounded-brand flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-brand-blue" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-brand-slate text-sm">{description}</p>
    </div>
  );
}

function FeatureItem({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-brand-blue" />
      </div>
      <span className="text-sm text-brand-slate">{text}</span>
    </li>
  );
}
