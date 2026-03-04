import { Mail, MessageSquare, Send } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Contact | ${SITE_NAME}`,
  description: "Get in touch with the Housing Near Hospitals team. We'd love to hear from you.",
};

export default function ContactPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-900 to-brand-800 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Contact Us</h1>
          <p className="mt-4 text-blue-200 text-lg">
            Have questions, feedback, or partnership inquiries? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Send className="w-5 h-5 text-brand-600" />
                Send a Message
              </h2>
              <form
                action="https://formspree.io/f/xbdanykd"
                method="POST"
                className="space-y-4"
              >
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">
                    I am a...
                  </label>
                  <select
                    id="type"
                    name="type"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                  >
                    <option value="healthcare-worker">Healthcare Worker</option>
                    <option value="travel-nurse">Travel Nurse</option>
                    <option value="property-manager">Property Manager</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm resize-none"
                    placeholder="How can we help?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors text-sm"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Info sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-brand-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Email Directly</h3>
                    <p className="text-sm text-slate-500">hello@housingnearhospitals.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Response Time</h3>
                    <p className="text-sm text-slate-500">We respond within 48 hours</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-2">For Healthcare Workers</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Looking for housing near your hospital? Use our search tool to find proximity-scored listings.
                  If you need help or have suggestions, drop us a line.
                </p>

                <h3 className="font-semibold text-slate-900 mb-2">For Property Managers</h3>
                <p className="text-sm text-slate-500">
                  Want to list your property for healthcare workers? Contact us about partnership opportunities
                  and listing your properties on our platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
