import Link from "next/link";
import {
  Shield,
  Building2,
  MapPin,
  Bed,
  Star,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { getVAHospitals } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Housing Near VA Hospitals | ${SITE_NAME}`,
  description:
    "Find apartments near VA hospitals. Housing guide for VA nurses, physicians, and staff with proximity-scored listings across multiple metros.",
  alternates: { canonical: "/guides/housing-near-va-hospitals" },
};

export const revalidate = 86400;

export default async function VAHospitalsGuidePage() {
  const hospitals = await getVAHospitals();

  // Group by metro
  const byMetro = new Map<
    string,
    { metroName: string; metroSlug: string; hospitals: typeof hospitals }
  >();
  for (const h of hospitals) {
    const existing = byMetro.get(h.metroSlug);
    if (existing) {
      existing.hospitals.push(h);
    } else {
      byMetro.set(h.metroSlug, {
        metroName: h.metroName,
        metroSlug: h.metroSlug,
        hospitals: [h],
      });
    }
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What are the benefits of working at a VA hospital?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "VA hospitals offer competitive salaries, federal benefits including retirement plans and health insurance, student loan repayment programs, and job stability. VA nurses and physicians also receive generous paid time off and opportunities for continuing education.",
        },
      },
      {
        "@type": "Question",
        name: "Do travel nurses work at VA hospitals?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The VA system regularly hires travel nurses to fill staffing gaps. Travel nurse assignments at VA hospitals typically run 13-26 weeks and offer competitive pay packages. The VA also has its own staffing agency (VA Traveler) for internal travel positions.",
        },
      },
      {
        "@type": "Question",
        name: "How close should I live to a VA hospital?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We recommend living within 20 minutes of your VA hospital. Many VA facilities are located in suburban areas with good parking, so driving is common. Our proximity scoring helps you find housing that minimizes your commute time.",
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
          <Shield className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold">
            Housing Near VA Hospitals
          </h1>
          <p className="mt-4 text-blue-200 text-lg">
            Find apartments near {hospitals.length} VA hospitals across{" "}
            {byMetro.size} metros. Built for VA nurses, physicians, and staff.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Intro */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Working at a VA Hospital
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              The Department of Veterans Affairs operates one of the largest
              healthcare systems in the country. VA hospitals serve millions of
              veterans and employ thousands of nurses, physicians, and support
              staff. Whether you are a permanent VA employee or a travel nurse on
              a 13-week assignment, living close to your facility helps you make
              the most of your time off.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              VA hospitals are often located in areas with different housing
              markets than nearby civilian hospitals. Our proximity scoring
              evaluates listings specifically based on drive time to each VA
              facility, so you can find the best housing for your commute.
            </p>
          </div>

          {/* Hospital List by Metro */}
          {Array.from(byMetro.values()).map((group) => (
            <div key={group.metroSlug}>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-600" />
                VA Hospitals in{" "}
                <Link
                  href={`/city/${group.metroSlug}`}
                  className="text-brand-700 hover:underline"
                >
                  {group.metroName}
                </Link>
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {group.hospitals.map((hospital) => (
                  <Link
                    key={hospital.id}
                    href={`/city/${group.metroSlug}/${hospital.slug}`}
                    className="group bg-white rounded-xl border border-slate-200 p-5 card-hover block"
                  >
                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                      {hospital.name}
                    </h3>
                    {hospital.address && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {hospital.city}, {hospital.stateCode}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      {hospital.bedCount && (
                        <span className="flex items-center gap-1">
                          <Bed className="w-3 h-3" />
                          {formatNumber(hospital.bedCount)} beds
                        </span>
                      )}
                      {hospital.cmsOverallRating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          {hospital.cmsOverallRating}/5 CMS
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-blue-500" />
                        VA Hospital
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-sm font-medium text-brand-700">
                      <span>View housing</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {hospitals.length === 0 && (
            <div className="text-center py-16 bg-slate-50 rounded-xl">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">
                VA hospital data is being imported. Check back soon.
              </p>
            </div>
          )}

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-brand-600" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "What are the benefits of working at a VA hospital?",
                  a: "VA hospitals offer competitive salaries, federal benefits including retirement plans and health insurance, student loan repayment programs, and job stability. VA nurses and physicians also receive generous paid time off and opportunities for continuing education.",
                },
                {
                  q: "Do travel nurses work at VA hospitals?",
                  a: "Yes. The VA system regularly hires travel nurses to fill staffing gaps. Assignments typically run 13-26 weeks with competitive pay packages. The VA also has its own staffing agency for internal travel positions.",
                },
                {
                  q: "How close should I live to a VA hospital?",
                  a: "We recommend living within 20 minutes of your VA hospital. Many VA facilities are in suburban areas with good parking, so driving is common. Our proximity scoring helps you find housing that minimizes commute time.",
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
              Find housing near your VA hospital
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
