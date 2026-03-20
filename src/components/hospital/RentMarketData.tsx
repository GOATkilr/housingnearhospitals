import { DollarSign, TrendingUp, Home } from "lucide-react";
import type { MarketDataSummary } from "@/lib/queries";

interface RentMarketDataProps {
  hospitalName: string;
  marketData: MarketDataSummary;
  metroAvgRent1br?: number;
}

export function RentMarketData({ hospitalName, marketData, metroAvgRent1br }: RentMarketDataProps) {
  const rentItems = [
    { label: "Studio", value: marketData.rentStudio },
    { label: "1 BR", value: marketData.rent1br },
    { label: "2 BR", value: marketData.rent2br },
    { label: "3 BR", value: marketData.rent3br },
  ].filter(item => item.value != null);

  if (rentItems.length === 0) return null;

  // Calculate comparison to metro average
  const comparison = metroAvgRent1br && marketData.rent1br
    ? Math.round(((marketData.rent1br - metroAvgRent1br) / metroAvgRent1br) * 100)
    : null;

  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Average Rent Near {hospitalName}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {rentItems.map(({ label, value }) => (
            <div key={label} className="bg-white rounded-lg px-4 py-3 border border-slate-200">
              <p className="text-2xl font-bold text-slate-900">
                ${value!.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">{label} /mo</p>
            </div>
          ))}
        </div>

        {/* Metro comparison + vacancy */}
        <div className="flex flex-wrap gap-6 mt-4 text-sm text-slate-500">
          {comparison !== null && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>
                {comparison > 0 ? `${comparison}% above` : `${Math.abs(comparison)}% below`} metro average
              </span>
            </div>
          )}
          {marketData.avgSqft && (
            <div className="flex items-center gap-1.5">
              <Home className="w-4 h-4" />
              <span>Avg. {marketData.avgSqft.toLocaleString()} sqft</span>
            </div>
          )}
          <div className="text-xs text-slate-400">
            Rent data from RentCast
          </div>
        </div>
      </div>
    </section>
  );
}
