import Link from "next/link";
import {
  Heart,
  Building2,
  DollarSign,
  MapPin,
  ArrowRight,
  HelpCircle,
  Star,
} from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import {
  getPetFriendlyListingCount,
  getPetFriendlyMetroStats,
} from "@/lib/queries";
import { formatNumber, formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Pet-Friendly Housing Near Hospitals | ${SITE_NAME}`,
  description:
    "Find pet-friendly apartments and houses near hospitals. Filter listings that allow dogs, cats, and other pets with proximity-scored results for healthcare workers.",
  alternates: { canonical: "/guides/pet-friendly-housing-near-hospitals" },
};

export const revalidate = 86400;

export default async function PetFriendlyGuidePage() {
  const [totalCount, metroStats] = await Promise.all([
    getPetFriendlyListingCount(),
    getPetFriendlyMetroStats(),
  ]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I find pet-friendly housing as a travel nurse?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use our pet-friendly filter when searching for listings near your hospital. Not all furnished rentals allow pets, so filtering early saves time. Look for listings that explicitly state 'pets allowed' and check for breed or weight restrictions before applying.",
        },
      },
      {
        "@type": "Question",
        name: "How much extra does pet-friendly housing cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Expect to pay a pet deposit of $200-$500 and sometimes monthly pet rent of $25-$75 per pet. Some landlords on Furnished Finder waive pet fees for travel nurses. Always ask about all pet-related costs upfront before signing a lease.",
        },
      },
      {
        "@type": "Question",
        name: "What should I look for in pet-friendly housing near a hospital?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Look for ground-floor units or buildings with elevators for easy outdoor access, nearby parks or walking areas, secure fencing if you have a dog, and pet-friendly neighbors. Also consider proximity to a veterinarian and pet supply stores.",
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
          <Heart className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold">
            Pet-Friendly Housing Near Hospitals
          </h1>
          <p className="mt-4 text-blue-200 text-lg">
            {totalCount > 0
              ? `Browse ${formatNumber(totalCount)} pet-friendly listings across ${metroStats.length} metros.`
              : "Find pet-friendly apartments near hospitals across our metro areas."}{" "}
            Built for healthcare workers who travel with their pets.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Intro */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Traveling with Pets as a Healthcare Worker
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              For many travel nurses and healthcare professionals, leaving a pet
              behind is not an option. Your dog or cat is family, and finding
              housing that welcomes them is a top priority when choosing your
              next assignment. The challenge is that many furnished rentals and
              short-term leases do not allow pets, which can significantly narrow
              your options.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              We tag every listing in our database with pet-friendliness so you
              can filter upfront. No more scrolling through dozens of apartments
              only to find out they do not allow your golden retriever. Use our
              pet-friendly filter on any hospital page to see only listings that
              welcome your companion.
            </p>
          </div>

          {/* Metro Stats */}
          {metroStats.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Pet-Friendly Listings by Metro
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {metroStats.map((metro) => (
                  <Link
                    key={metro.metroSlug}
                    href={`/city/${metro.metroSlug}`}
                    className="group bg-white rounded-xl border border-slate-200 p-5 card-hover block"
                  >
                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                      {metro.metroName}
                    </h3>
                    <div className="mt-3 space-y-1 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-pink-500" />
                        {metro.count} pet-friendly listings
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {formatPrice(metro.avgRent)}/mo avg rent
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-sm font-medium text-brand-700">
                      <span>Browse</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Tips for Pet-Friendly Housing
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Check Restrictions First
                </h3>
                <p className="text-sm text-slate-500">
                  Many &quot;pet-friendly&quot; rentals have breed restrictions,
                  weight limits, or only allow cats. Always confirm your specific
                  pet is welcome before applying.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Budget for Extra Costs
                </h3>
                <p className="text-sm text-slate-500">
                  Pet deposits ($200-$500) and monthly pet rent ($25-$75) add up.
                  Factor these into your housing budget alongside your stipend
                  calculation.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Look for Green Space
                </h3>
                <p className="text-sm text-slate-500">
                  If you have a dog, proximity to parks or walking trails is
                  essential. Ground-floor units with patios are ideal for quick
                  outdoor breaks during long shift days.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Plan for Pet Care
                </h3>
                <p className="text-sm text-slate-500">
                  12-hour shifts mean your pet will be alone for long stretches.
                  Look into local dog walkers, pet sitters, or doggy daycares
                  near your housing.
                </p>
              </div>
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
                  q: "How do I find pet-friendly housing as a travel nurse?",
                  a: 'Use our pet-friendly filter when searching for listings near your hospital. Not all furnished rentals allow pets, so filtering early saves time. Look for listings that explicitly state "pets allowed" and check for breed or weight restrictions.',
                },
                {
                  q: "How much extra does pet-friendly housing cost?",
                  a: "Expect a pet deposit of $200-$500 and sometimes monthly pet rent of $25-$75 per pet. Some landlords waive pet fees for travel nurses. Always ask about all pet-related costs before signing a lease.",
                },
                {
                  q: "What should I look for in pet-friendly housing near a hospital?",
                  a: "Look for ground-floor units or buildings with elevators, nearby parks or walking areas, secure fencing for dogs, and pet-friendly neighbors. Also consider proximity to a veterinarian and pet supply stores.",
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
              Find pet-friendly housing near your hospital
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Search by hospital and filter for pet-friendly listings.
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
