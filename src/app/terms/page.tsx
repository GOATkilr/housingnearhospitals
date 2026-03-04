import { SITE_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Terms of Service | ${SITE_NAME}`,
  description: "Terms of service for Housing Near Hospitals.",
};

export default function TermsPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-900 to-brand-800 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Terms of Service</h1>
          <p className="mt-4 text-blue-200">Last updated: March 2026</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Use of Service</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Housing Near Hospitals provides a search platform that helps healthcare workers find
                housing near their workplace. By using our service, you agree to these terms. You must
                be at least 18 years old to use this site. You agree not to misuse the service, attempt
                to access it through unauthorized means, or use it for any unlawful purpose.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Advertising &amp; Revenue Disclosure</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Housing Near Hospitals may display advertisements, sponsored content, and featured
                listings from third-party partners including staffing agencies, housing platforms,
                and service providers. We may also earn commissions when you use partner services
                linked from our site, at no additional cost to you. Advertising and partnership
                relationships do not influence our proximity scores or ranking algorithms — all
                scores are calculated purely based on distance and listing quality factors.
                Sponsored content is always labeled as such.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Listing Data Disclaimer</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Listing information displayed on Housing Near Hospitals is provided for informational
                purposes only. We do not guarantee the accuracy, completeness, or availability of any
                listing. Prices, availability, and property details may change without notice. Always
                verify listing details directly with the property manager or hosting platform before
                making any housing decisions. Housing Near Hospitals is not a landlord, property
                manager, or real estate broker.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">No Warranty</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                The service is provided &quot;as is&quot; and &quot;as available&quot; without warranties
                of any kind, either express or implied. We do not warrant that the service will be
                uninterrupted, error-free, or free of harmful components. Commute time estimates are
                approximations and may differ from actual travel times based on traffic, route, and
                conditions.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Limitation of Liability</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                To the maximum extent permitted by law, Housing Near Hospitals shall not be liable for
                any indirect, incidental, special, consequential, or punitive damages resulting from
                your use of the service, including but not limited to damages arising from housing
                decisions made based on information provided on this site.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Intellectual Property</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                All content, design, and scoring algorithms on Housing Near Hospitals are the
                property of Housing Near Hospitals or its licensors. You may not reproduce,
                distribute, or create derivative works from our content without prior written consent.
                Hospital data is sourced from publicly available government datasets.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">DMCA Notice</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                If you believe that content on Housing Near Hospitals infringes your copyright, please
                send a DMCA takedown notice to hello@housingnearhospitals.com with: (1) identification
                of the copyrighted work, (2) identification of the infringing material and its location
                on our site, (3) your contact information, (4) a statement of good faith belief that
                the use is not authorized, and (5) a statement under penalty of perjury that the
                information is accurate and you are the copyright owner or authorized to act on their
                behalf.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Changes to Terms</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                We may update these terms from time to time. Continued use of the service after changes
                constitutes acceptance of the new terms. We will update the &quot;Last updated&quot;
                date at the top of this page when changes are made.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Contact</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                If you have questions about these terms, please contact us at
                hello@housingnearhospitals.com.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
