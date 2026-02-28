import { Mail, MessageSquare } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { SITE_URL } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Contact | ${SITE_NAME}`,
  description: "Get in touch with the Housing Near Hospitals team. We'd love to hear from you.",
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: `Contact | ${SITE_NAME}`,
    description: "Get in touch with the Housing Near Hospitals team. We'd love to hear from you.",
    url: `${SITE_URL}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div>
      <section className="bg-brand-navy text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Contact Us</h1>
          <p className="mt-4 text-blue-200 text-lg">
            Have questions, feedback, or partnership inquiries? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-brand border border-gray-200 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-brand-blue" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Email</h2>
                <p className="text-sm text-slate-500">hello@housingnearhospitals.com</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Feedback</h2>
                <p className="text-sm text-slate-500">We read every message and respond within 48 hours.</p>
              </div>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">For Healthcare Workers</h3>
              <p className="text-sm text-slate-500">
                Looking for housing near your hospital? Use our search tool to find proximity-scored listings.
                If you need help or have suggestions, drop us a line.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">For Property Managers</h3>
              <p className="text-sm text-slate-500">
                Want to list your property for healthcare workers? Contact us about partnership opportunities
                and listing your properties on our platform.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
