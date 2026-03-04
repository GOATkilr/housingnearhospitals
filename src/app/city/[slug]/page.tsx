import { notFound } from "next/navigation";
import { MapPin, Users, DollarSign, Building2 } from "lucide-react";
import { LAUNCH_METROS } from "@/lib/constants";
import { getHospitalsByMetro, getMetroBySlug } from "@/lib/queries";
import { HospitalCard } from "@/components/hospital/HospitalCard";
import { formatNumber, formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

interface CityPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return LAUNCH_METROS.map((metro) => ({ slug: metro.slug }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const metro = LAUNCH_METROS.find((m) => m.slug === params.slug);
  if (!metro) return {};
  return {
    title: `Housing Near ${metro.name} Hospitals`,
    description: `Find apartments and housing near hospitals in ${metro.name}. Browse ${metro.hospitalCount}+ hospitals with proximity-scored listings for healthcare workers.`,
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const metro = LAUNCH_METROS.find((m) => m.slug === params.slug);
  if (!metro) {
    notFound();
  }

  const [hospitals, metroData] = await Promise.all([
    getHospitalsByMetro(metro.slug),
    getMetroBySlug(metro.slug),
  ]);

  return (
    <div>
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
          <p className="mt-3 text-blue-200 text-lg max-w-2xl">
            {metro.tagline}
          </p>

          {/* Metro stats */}
          <div className="mt-8 flex flex-wrap gap-6">
            <Stat icon={Building2} label="Hospitals" value={`${hospitals.length || metro.hospitalCount}+`} />
            <Stat icon={Users} label="Metro Population" value={metroData?.metroPop ? formatNumber(metroData.metroPop) : "--"} />
            <Stat icon={DollarSign} label="Avg 1BR Rent" value={metroData?.avgRent1br ? formatPrice(metroData.avgRent1br) : "--"} />
          </div>
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
