import type { Metadata } from "next";
import { RentEstimateForm } from "@/components/rent-estimate/RentEstimateForm";

export const metadata: Metadata = {
  title: "Rent Estimate Near Hospitals | Housing Near Hospitals",
  description:
    "What should rent cost near your hospital? Get instant rent estimates by hospital with comparisons by bedroom count. Free tool for healthcare workers.",
  alternates: { canonical: "/rent-estimate" },
};

export default function RentEstimatePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-900 to-brand-800 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">
            What Should Rent Cost Near Your Hospital?
          </h1>
          <p className="mt-4 text-lg text-blue-200">
            Get instant rent estimates based on location, bedrooms, and property type.
            Powered by real market data.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <RentEstimateForm />
        </div>
      </section>

      {/* SEO content */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            How Our Rent Estimator Works
          </h2>
          <div className="prose prose-slate max-w-none">
            <p>
              Our rent estimator uses real-time market data to calculate what you should
              expect to pay for housing near your hospital. Select your hospital, choose
              your preferred bedroom count and property type, and get an instant estimate
              with comparable listings in the area.
            </p>
            <p>
              Whether you&apos;re a travel nurse starting a new assignment, a medical
              resident relocating, or a healthcare worker exploring housing options,
              this tool helps you budget accurately for your next move.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
