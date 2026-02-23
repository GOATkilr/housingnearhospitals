import { Building2, Heart, MapPin, TrendingUp } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `About | ${SITE_NAME}`,
  description: "Learn about Housing Near Hospitals — a platform built to help healthcare workers find housing scored by commute time to their hospital.",
};

export default function AboutPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-900 to-brand-800 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">About {SITE_NAME}</h1>
          <p className="mt-4 text-blue-200 text-lg">
            We help healthcare workers find housing scored by commute time to their hospital.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed">
              Finding housing near a hospital shouldn&apos;t be hard. Whether you&apos;re a travel nurse
              starting a 13-week contract, a medical resident relocating for training, or a new hire
              at a hospital system, we make it easy to find housing optimized for your commute.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <Heart className="w-8 h-8 text-emerald-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Built for Healthcare</h3>
              <p className="text-sm text-slate-500">Every feature is designed with healthcare workers in mind — shift-aware commute scoring, furnished filters, and short-term lease options.</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <TrendingUp className="w-8 h-8 text-brand-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Proximity Scoring</h3>
              <p className="text-sm text-slate-500">Every listing gets a 0-100 proximity score based on estimated drive time, distance, and shift-specific commute data.</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <MapPin className="w-8 h-8 text-amber-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Growing Coverage</h3>
              <p className="text-sm text-slate-500">We&apos;re launching in Nashville, Houston, and Phoenix — three of America&apos;s biggest healthcare markets — with more cities coming soon.</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <Building2 className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Comprehensive Data</h3>
              <p className="text-sm text-slate-500">We index hospitals from federal datasets (HIFLD, CMS) and aggregate housing listings from multiple sources to give you the best options.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
