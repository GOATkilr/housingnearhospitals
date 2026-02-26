import Link from "next/link";
import { Building2, Clock, Armchair, Shield, Star, ArrowRight } from "lucide-react";
import { SITE_NAME, LAUNCH_METROS } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Travel Nurse Housing Guide | ${SITE_NAME}`,
  description: "Complete guide to finding housing as a travel nurse. Tips on furnished rentals, short-term leases, and proximity to your hospital assignment.",
};

export default function TravelNurseGuidePage() {
  return (
    <div>
      <section className="bg-brand-navy text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Travel Nurse Housing Guide</h1>
          <p className="mt-4 text-blue-200 text-lg">
            Everything you need to know about finding housing for your next travel nursing assignment.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">What to Look For</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-brand border border-gray-200 p-5">
                <Armchair className="w-6 h-6 text-brand-blue mb-2" />
                <h3 className="font-semibold text-slate-900 mb-1">Furnished Rentals</h3>
                <p className="text-sm text-slate-500">Look for fully furnished units with utilities included. This saves you the hassle of moving furniture for a 13-week contract.</p>
              </div>
              <div className="bg-white rounded-brand border border-gray-200 p-5">
                <Clock className="w-6 h-6 text-emerald-600 mb-2" />
                <h3 className="font-semibold text-slate-900 mb-1">Short-Term Leases</h3>
                <p className="text-sm text-slate-500">Most travel contracts are 13 weeks. Look for month-to-month or 3-month lease options to match your assignment length.</p>
              </div>
              <div className="bg-white rounded-brand border border-gray-200 p-5">
                <Building2 className="w-6 h-6 text-amber-600 mb-2" />
                <h3 className="font-semibold text-slate-900 mb-1">Proximity to Hospital</h3>
                <p className="text-sm text-slate-500">After a 12-hour shift, a short commute matters. We score every listing by drive time to your specific hospital.</p>
              </div>
              <div className="bg-white rounded-brand border border-gray-200 p-5">
                <Shield className="w-6 h-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-slate-900 mb-1">Safe Neighborhoods</h3>
                <p className="text-sm text-slate-500">Night shifts mean coming home late. Prioritize well-lit areas with low crime rates near your hospital.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Tips for Travel Nurses</h2>
            <ol className="space-y-3 text-slate-600 text-sm leading-relaxed list-decimal list-inside">
              <li><strong>Start early.</strong> Begin searching 4-6 weeks before your assignment starts.</li>
              <li><strong>Check your stipend.</strong> Know your housing stipend amount and find listings within budget.</li>
              <li><strong>Verify the listing.</strong> Look for verified listings and read reviews from other healthcare workers.</li>
              <li><strong>Consider commute times.</strong> Use our proximity scoring to find places with the shortest commute to your hospital.</li>
              <li><strong>Ask about utilities.</strong> Some furnished rentals include utilities, wifi, and parking — factor this into your cost comparison.</li>
            </ol>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Available Cities</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {LAUNCH_METROS.map((metro) => (
                <Link
                  key={metro.slug}
                  href={`/city/${metro.slug}`}
                  className="bg-white rounded-brand border border-gray-200 p-4 card-hover block"
                >
                  <h3 className="font-semibold text-slate-900">{metro.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{metro.hospitalCount}+ hospitals</p>
                  <div className="flex items-center gap-1 mt-2 text-sm font-medium text-brand-blue">
                    <span>Browse</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-brand-light rounded-brand p-6 text-center">
            <Star className="w-8 h-8 text-brand-blue mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to find housing?</h3>
            <p className="text-sm text-slate-500 mb-4">Search by hospital and see proximity-scored listings.</p>
            <Link href="/search" className="btn-primary inline-block text-sm">
              Start Searching
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
