import Link from "next/link";
import { Building2, Clock, Armchair, Shield, Star, ArrowRight, DollarSign, CheckCircle2, HelpCircle } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { getMetrosForNav } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Travel Nurse Housing Guide 2026 | ${SITE_NAME}`,
  description: "Complete guide to finding housing as a travel nurse. Tips on housing stipends, furnished rentals, short-term leases, neighborhood evaluation, and proximity to your hospital assignment.",
};

export default async function TravelNurseGuidePage() {
  const metros = await getMetrosForNav();
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-900 to-brand-800 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Travel Nurse Housing Guide</h1>
          <p className="mt-4 text-blue-200 text-lg">
            Everything you need to know about finding housing for your next travel nursing assignment.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          {/* What to Look For */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">What to Look For</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Finding the right housing can make or break a travel nursing assignment. After a 12-hour shift,
              the last thing you want is an hour-long commute or a noisy apartment. Here are the four pillars
              of great travel nurse housing.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <Armchair className="w-6 h-6 text-brand-600 mb-2" />
                <h3 className="font-semibold text-slate-900 mb-1">Furnished Rentals</h3>
                <p className="text-sm text-slate-500">Look for fully furnished units with utilities included. This saves you the hassle of moving furniture for a 13-week contract. A good furnished rental should include a bed, couch, kitchenware, linens, and reliable WiFi.</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <Clock className="w-6 h-6 text-emerald-600 mb-2" />
                <h3 className="font-semibold text-slate-900 mb-1">Short-Term Leases</h3>
                <p className="text-sm text-slate-500">Most travel contracts are 13 weeks. Look for month-to-month or 3-month lease options to match your assignment length. Avoid signing a 12-month lease unless you plan to extend or sublet.</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <Building2 className="w-6 h-6 text-amber-600 mb-2" />
                <h3 className="font-semibold text-slate-900 mb-1">Proximity to Hospital</h3>
                <p className="text-sm text-slate-500">After a 12-hour shift, a short commute matters. We score every listing by drive time to your specific hospital. Aim for 15 minutes or less for the best quality of life.</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <Shield className="w-6 h-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-slate-900 mb-1">Safe Neighborhoods</h3>
                <p className="text-sm text-slate-500">Night shifts mean coming home at 3 AM. Prioritize well-lit areas with secure parking. Ask other travel nurses about the neighborhood, or check local crime maps before signing a lease.</p>
              </div>
            </div>
          </div>

          {/* Housing Stipend Breakdown */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              Understanding Your Housing Stipend
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Your housing stipend is the tax-free portion of your travel nurse pay package designated for
              housing costs. Understanding how it works is critical to maximizing your take-home pay.
            </p>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">How Stipends Work</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Travel nurse agencies offer two options: company-provided housing or a housing stipend.
                  With company housing, the agency finds and pays for your apartment. With a stipend,
                  you receive a tax-free allowance (typically $1,500 to $3,500/month depending on location)
                  and find your own housing. Most experienced travelers take the stipend because it offers
                  more control and often more savings.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Stipend vs. Company Housing</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Taking the stipend and finding affordable housing means you pocket the difference tax-free.
                  For example, if your stipend is $2,800/month and you find a great furnished apartment for
                  $1,800/month, that extra $1,000/month ($3,000 per 13-week contract) goes straight into
                  your savings. Company housing is convenient but usually costs the agency more, which
                  reduces your overall pay package.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Tax Implications</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Housing stipends are tax-free only if you maintain a &quot;tax home&quot; — a permanent
                  residence you pay for even while on assignment. The IRS requires you to duplicate expenses
                  (pay for housing in both locations) to qualify. Keep all receipts and consult a tax
                  professional familiar with travel nursing. Without a tax home, your stipend becomes
                  taxable income.
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-sm text-amber-800 font-medium">
                  Typical monthly stipends by market: Nashville $2,200-$2,800 | Houston $2,000-$2,600 | Phoenix $2,100-$2,700
                </p>
              </div>
            </div>
          </div>

          {/* Neighborhood Evaluation Checklist */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-brand-600" />
              Neighborhood Evaluation Checklist
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Before committing to a rental, evaluate the neighborhood using this checklist. As a travel
              nurse, you may not be familiar with the area — these steps help you make a safe, informed decision.
            </p>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <ul className="space-y-3">
                {[
                  { label: "Drive time to hospital", detail: "Test the route during shift-change hours (6:30 AM and 7:00 PM). Our proximity scores estimate this, but real traffic varies." },
                  { label: "Grocery and pharmacy access", detail: "Are essentials within 10 minutes? After a long shift, you don't want to drive far for food or medications." },
                  { label: "Parking situation", detail: "Is parking included? Is it covered or gated? Night shift nurses need safe, well-lit parking." },
                  { label: "Street noise levels", detail: "Visit at night if possible. Avoid units near highways, train tracks, or bars if you're a day sleeper." },
                  { label: "Laundry facilities", detail: "In-unit washer/dryer is ideal. If shared, check if machines are well-maintained and available." },
                  { label: "Cell service and WiFi", detail: "Test your carrier's signal. Ask about internet speed — you'll need reliable connectivity for telehealth, charting, or just unwinding." },
                  { label: "Nearby hospitals for moonlighting", detail: "If you plan to pick up extra shifts, check if other hospitals are nearby for per diem work." },
                  { label: "Pet policy (if applicable)", detail: "Traveling with pets? Confirm breed restrictions, deposits, and whether there's outdoor space." },
                ].map((item) => (
                  <li key={item.label} className="flex gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-slate-900 text-sm">{item.label}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Furnished Rental Checklist */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Armchair className="w-6 h-6 text-brand-600" />
              Furnished Rental Checklist
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Not all &quot;furnished&quot; rentals are created equal. Some include everything down to towels
              and coffee mugs, while others provide just a bed and couch. Here&apos;s what to confirm before booking.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-2 text-sm">Essentials (Must-Have)</h3>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li>Bed with mattress, pillows, and linens</li>
                  <li>Couch or seating area</li>
                  <li>Kitchen table and chairs</li>
                  <li>Pots, pans, dishes, and utensils</li>
                  <li>Towels and bath essentials</li>
                  <li>Working washer/dryer or laundry access</li>
                  <li>WiFi internet included</li>
                  <li>Basic cleaning supplies</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-2 text-sm">Nice-to-Have</h3>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li>Smart TV with streaming access</li>
                  <li>Coffee maker and toaster</li>
                  <li>Desk or workspace for charting</li>
                  <li>Blackout curtains (critical for night shift)</li>
                  <li>Iron and ironing board</li>
                  <li>Extra storage/closet space</li>
                  <li>Outdoor patio or balcony</li>
                  <li>Gym access in the building</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Pro tip:</strong> Ask for a video walkthrough before booking if you can&apos;t visit
                in person. Request photos of the kitchen, bathroom, bedroom, and any common areas. Check
                review sites for feedback from other travel nurses who stayed there.
              </p>
            </div>
          </div>

          {/* Step-by-Step Tips */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Step-by-Step: Finding Your Housing</h2>
            <ol className="space-y-4 text-slate-600 text-sm leading-relaxed">
              <li className="flex gap-3">
                <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                <div>
                  <strong className="text-slate-900">Start searching 4-6 weeks early.</strong> The best
                  furnished rentals near hospitals get booked fast. Set alerts on Furnished Finder and check
                  Housing Near Hospitals for proximity-scored options.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                <div>
                  <strong className="text-slate-900">Know your stipend amount.</strong> Get the exact number
                  from your recruiter. Factor in utilities, parking, and renter&apos;s insurance when
                  comparing costs.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                <div>
                  <strong className="text-slate-900">Use proximity scoring.</strong> Our tool calculates
                  estimated drive time to your hospital for every listing. Aim for a proximity score of 75+
                  (under 15 minutes) for the best commute experience.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                <div>
                  <strong className="text-slate-900">Verify the listing.</strong> Look for verified listings,
                  read reviews, and ask to speak with the landlord or property manager directly. Request a
                  lease agreement before sending any deposits.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">5</span>
                <div>
                  <strong className="text-slate-900">Compare total costs.</strong> Rent is just one factor.
                  Add utilities ($100-200/mo if not included), parking ($50-150/mo), renter&apos;s insurance
                  ($15-30/mo), and internet ($50-80/mo) for the true monthly cost.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">6</span>
                <div>
                  <strong className="text-slate-900">Document everything.</strong> Take photos of the unit
                  on move-in day. Note any existing damage in writing and share with the landlord. This
                  protects your security deposit when you leave.
                </div>
              </li>
            </ol>
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
                  q: "How much should I budget for housing as a travel nurse?",
                  a: "Most travel nurses spend $1,200-$2,500/month on housing depending on the city. In Nashville, expect $1,500-$2,200 for a furnished 1BR. Houston is slightly cheaper at $1,200-$1,800, and Phoenix ranges from $1,300-$2,000. Always try to stay under your stipend amount to maximize tax-free savings.",
                },
                {
                  q: "Should I take company housing or the stipend?",
                  a: "Most experienced travel nurses take the stipend. You have more control over location, quality, and cost. Company housing is convenient for first-time travelers who want a hands-off experience, but it typically reduces your overall pay package by $200-500/week.",
                },
                {
                  q: "What if my assignment gets cancelled or shortened?",
                  a: "This is why short-term leases matter. Month-to-month agreements protect you from paying rent on an empty apartment. If you signed a 3-month lease, check the cancellation clause. Some landlords on Furnished Finder offer nurse-friendly cancellation policies.",
                },
                {
                  q: "Can I share housing with another travel nurse?",
                  a: "Yes, and many do. Splitting a 2BR apartment cuts costs significantly. Facebook travel nurse groups and agency message boards are good places to find roommates. Just make sure both names are on the lease for protection.",
                },
                {
                  q: "How far from the hospital is too far?",
                  a: "We recommend staying within 20 minutes of your hospital. Our scoring system gives the highest scores to listings under 10 minutes away. After 12-hour shifts — especially night shifts — a short commute isn't just convenient, it's a safety issue.",
                },
                {
                  q: "What's the difference between Furnished Finder and Apartments.com?",
                  a: "Furnished Finder specializes in furnished, short-term rentals specifically for travel healthcare workers. Listings are often from individual landlords who understand travel nurse needs. Apartments.com covers the broader rental market including unfurnished, long-term apartments. Use Furnished Finder for ready-to-move-in options, and Apartments.com when you want more choices or plan to furnish your own place.",
                },
              ].map((faq) => (
                <div key={faq.q} className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm">{faq.q}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Available Cities */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Available Cities</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              We currently cover hospitals and housing in three major metros. Each city page shows all
              nearby hospitals with proximity-scored listings.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {metros.map((metro) => (
                <Link
                  key={metro.slug}
                  href={`/city/${metro.slug}`}
                  className="bg-white rounded-xl border border-slate-200 p-4 card-hover block"
                >
                  <h3 className="font-semibold text-slate-900">{metro.name}</h3>
                  <div className="flex items-center gap-1 mt-2 text-sm font-medium text-brand-700">
                    <span>Browse</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-brand-50 rounded-xl p-6 text-center">
            <Star className="w-8 h-8 text-brand-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to find housing?</h3>
            <p className="text-sm text-slate-500 mb-4">Search by hospital and see proximity-scored listings tailored for healthcare workers.</p>
            <Link href="/search" className="btn-primary inline-block text-sm">
              Start Searching
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
