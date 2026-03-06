import { notFound } from "next/navigation";
import { MapPin, Users, DollarSign, Building2 } from "lucide-react";
import { getHospitalsByMetro, getMetroBySlug, getActiveMetroSlugs } from "@/lib/queries";
import { HospitalCard } from "@/components/hospital/HospitalCard";
import { formatNumber, formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 3600; // Revalidate hourly

interface CityPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const slugs = await getActiveMetroSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const metro = await getMetroBySlug(params.slug);
  if (!metro) return {};
  const hospitals = await getHospitalsByMetro(metro.slug);
  const avgRent = metro.avgRent1br ? formatPrice(metro.avgRent1br) : null;
  const parts = [
    `Find apartments near ${hospitals.length} hospitals in ${metro.name}.`,
    avgRent ? `Avg 1BR rent: ${avgRent}.` : null,
    "Proximity-scored listings for healthcare workers.",
  ].filter(Boolean).join(" ");
  return {
    title: `Housing Near ${metro.name} Hospitals`,
    description: parts,
    alternates: { canonical: `/city/${metro.slug}` },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const metro = await getMetroBySlug(params.slug);
  if (!metro) {
    notFound();
  }

  const hospitals = await getHospitalsByMetro(metro.slug);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Hospitals in ${metro.name}`,
    numberOfItems: hospitals.length,
    itemListElement: hospitals.map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: h.name,
      url: `https://housingnearhospitals.com/city/${metro.slug}/${h.slug}`,
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-900 to-brand-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-blue-300 text-sm mb-4">
            <MapPin className="w-4 h-4" />
            <span>{metro.name}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Housing Near {metro.name} Hospitals
          </h1>

          {/* Metro stats */}
          <div className="mt-8 flex flex-wrap gap-6">
            <Stat icon={Building2} label="Hospitals" value={`${hospitals.length}+`} />
            <Stat icon={Users} label="Metro Population" value={metro.metroPop ? formatNumber(metro.metroPop) : "--"} />
            <Stat icon={DollarSign} label="Avg 1BR Rent" value={metro.avgRent1br ? formatPrice(metro.avgRent1br) : "--"} />
          </div>

          <p className="mt-6 text-blue-200 text-sm leading-relaxed max-w-2xl">
            Browse {hospitals.length} hospitals in the {metro.name} metro
            {metro.metroPop ? ` (pop. ${formatNumber(metro.metroPop)})` : ""}
            {metro.avgRent1br ? ` where the average 1-bedroom rents for ${formatPrice(metro.avgRent1br)}/mo` : ""}.
            Every listing is scored by commute time so you can find housing close to your workplace.
          </p>
        </div>
      </section>

      {/* Hospital List */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Hospitals in {metro.name}
          </h2>

          {hospitals.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {hospitals.map((hospital) => (
                <HospitalCard
                  key={hospital.id}
                  hospital={hospital}
                  metroSlug={metro.slug}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Hospital data is being imported. Check back soon.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3">
      <Icon className="w-5 h-5 text-emerald-400" />
      <div>
        <p className="text-white font-semibold">{value}</p>
        <p className="text-blue-300 text-xs">{label}</p>
      </div>
    </div>
  );
}
