import { SITE_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description: "Privacy policy for Housing Near Hospitals.",
};

export default function PrivacyPage() {
  return (
    <div>
      <section className="bg-brand-navy text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
          <p className="mt-4 text-blue-200">Last updated: February 2026</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Information We Collect</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                We collect information you provide directly, such as when you create an account,
                search for housing, or contact us. This may include your name, email address,
                and housing preferences.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">How We Use Information</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                We use the information we collect to provide, maintain, and improve our services,
                including personalizing your housing search results and sending you relevant
                notifications about new listings near your hospital.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Data Sharing</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                We do not sell your personal information. We may share anonymized, aggregate data
                with partners to improve our services. When you click through to a listing on a
                third-party platform, that platform&apos;s privacy policy applies.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Cookies</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                We use cookies and similar technologies to remember your preferences,
                understand how you use our service, and improve your experience.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Contact</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                If you have questions about this privacy policy, please contact us at
                hello@housingnearhospitals.com.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
