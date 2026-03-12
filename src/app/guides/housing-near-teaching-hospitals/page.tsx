import Link from "next/link";
import {
  GraduationCap,
  Building2,
  MapPin,
  Bed,
  Star,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { getTeachingHospitals } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Housing Near Teaching Hospitals | ${SITE_NAME}`,
  description:
    "Find apartments near major teaching hospitals. Housing guide for medical residents, fellows, and nursing students with proximity-scored listings.",
  alternates: { canonical: "/guides/housing-near-teaching-hospitals" },
};

export const revalidate = 86400;

export default async function TeachingHospitalsGuidePage() {
  const hospitals = await getTeachingHospitals();

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
        name: "What is a teaching hospital?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A teaching hospital is a medical facility affiliated with a medical school that trains residents and fellows. These hospitals typically offer more specialized care, conduct research, and have larger bed counts. Major teaching hospitals are recognized by the Association of American Medical Colleges.",
        },
      },
      {
        "@type": "Question",
        name: "Why should I live near a teaching hospital?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Medical residents often work 60-80 hour weeks with early morning and overnight call shifts. Living close to your teaching hospital reduces commute stress, gives you more time to rest between shifts, and can be critical during on-call rotations when you need to get to the hospital quickly.",
        },
      },
      {
        "@type": "Question",
        name: "How much do medical residents spend on housing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Medical residents typically spend 25-35% of their salary on housing. With average resident salaries of $60,000-$70,000, that means $1,250-$2,000/month depending on the city. Many residents share apartments to reduce costs, especially in expensive cities.",
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
          <GraduationCap className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold">
            Housing Near Teaching Hospitals
          </h1>
          <p className="mt-4 text-blue-200 text-lg">
            Find apartments near {hospitals.length} major teaching hospitals
            across {byMetro.size} metros. Built for residents, fellows, and
            medical students.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Intro */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Why Housing Matters for Residents
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Medical residency is demanding. With shifts often exceeding 12
              hours and unpredictable call schedules, your commute directly
              affects your wellbeing. Living close to your teaching hospital
              means more sleep, less stress, and better performance during
              training.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              We index every major teaching hospital in our network and score
              nearby listings by drive time. Whether you are starting an
              internal medicine residency or a surgical fellowship, finding
              housing within 15 minutes of the hospital can make a meaningful
              difference in your quality of life.
            </p>
          </div>

          {/* Hospital List by Metro */}
          {Array.from(byMetro.values()).map((group) => (
            <div key={group.metroSlug}>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-600" />
                Teaching Hospitals in{" "}
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
                    {hospital.systemName && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {hospital.systemName}
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
                        <GraduationCap className="w-3 h-3 text-purple-500" />
                        Major Teaching
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

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-brand-600" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "What is a teaching hospital?",
                  a: "A teaching hospital is a medical facility affiliated with a medical school that trains residents and fellows. These hospitals typically offer more specialized care, conduct research, and have larger bed counts.",
                },
                {
                  q: "Why should I live near a teaching hospital?",
                  a: "Medical residents often work 60-80 hour weeks with early morning and overnight call shifts. Living close reduces commute stress, gives you more rest between shifts, and can be critical during on-call rotations.",
                },
                {
                  q: "How much do medical residents spend on housing?",
                  a: "Medical residents typically spend 25-35% of their salary on housing. With average resident salaries of $60,000-$70,000, that means $1,250-$2,000/month depending on the city. Many share apartments to reduce costs.",
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
              Find housing near your teaching hospital
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
