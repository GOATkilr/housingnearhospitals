"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Menu,
  X,
  Search,
  MapPin,
  ChevronDown,
  BookOpen,
  Map,
  Calculator,
} from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

interface MetroLink {
  slug: string;
  name: string;
}

/* ── Region buckets for the mega-menu ── */
const REGIONS: Record<string, string[]> = {
  Northeast: [
    "boston-ma",
    "new-york-ny",
    "philadelphia-pa",
    "pittsburgh-pa",
    "baltimore-md",
    "washington-dc",
  ],
  Southeast: [
    "atlanta-ga",
    "charlotte-nc",
    "miami-fl",
    "nashville-tn",
    "orlando-fl",
    "raleigh-nc",
    "tampa-fl",
  ],
  Midwest: [
    "chicago-il",
    "cleveland-oh",
    "columbus-oh",
    "detroit-mi",
    "minneapolis-mn",
    "st-louis-mo",
  ],
  West: [
    "denver-co",
    "los-angeles-ca",
    "phoenix-az",
    "portland-or",
    "san-diego-ca",
    "san-francisco-ca",
    "seattle-wa",
  ],
  Texas: ["austin-tx", "dallas-tx", "houston-tx", "san-antonio-tx"],
};

function bucketMetros(metros: MetroLink[]) {
  const bySlug: Record<string, MetroLink> = {};
  for (const m of metros) bySlug[m.slug] = m;
  const result: { region: string; metros: MetroLink[] }[] = [];
  for (const [region, slugs] of Object.entries(REGIONS)) {
    const matched = slugs
      .map((s) => bySlug[s])
      .filter(Boolean) as MetroLink[];
    if (matched.length) result.push({ region, metros: matched });
  }
  // any metros not in a region
  const assignedSlugs = Object.values(REGIONS).flat();
  const assignedSet: Record<string, boolean> = {};
  for (const s of assignedSlugs) assignedSet[s] = true;
  const other = metros.filter((m) => !assignedSet[m.slug]);
  if (other.length) result.push({ region: "Other", metros: other });
  return result;
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [metros, setMetros] = useState<MetroLink[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch("/api/v1/metros")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.data ?? data ?? []) as MetroLink[];
        setMetros(list);
      })
      .catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setCitiesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route change (resize as proxy)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const regions = bucketMetros(metros);

  const handleDropdownEnter = () => {
    clearTimeout(timeoutRef.current);
    setCitiesOpen(true);
  };

  const handleDropdownLeave = () => {
    timeoutRef.current = setTimeout(() => setCitiesOpen(false), 200);
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-700 to-brand-900 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-[17px] text-slate-900 hidden sm:block tracking-tight">
              {SITE_NAME}
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Cities mega-menu */}
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={handleDropdownEnter}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                onClick={() => setCitiesOpen(!citiesOpen)}
                className={`nav-link group inline-flex items-center gap-1.5 ${
                  citiesOpen ? "text-brand-800 bg-brand-50" : ""
                }`}
              >
                <MapPin className="w-4 h-4" />
                Cities
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    citiesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Mega dropdown */}
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 ${
                  citiesOpen
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-1 pointer-events-none"
                }`}
              >
                <div className="bg-white rounded-xl shadow-xl border border-slate-200/80 ring-1 ring-black/5 p-5 min-w-[620px]">
                  <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                    {regions.map(({ region, metros: regionMetros }) => (
                      <div key={region}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          {region}
                        </p>
                        <ul className="space-y-0.5">
                          {regionMetros.map((metro) => (
                            <li key={metro.slug}>
                              <Link
                                href={`/city/${metro.slug}`}
                                className="block px-2 py-1.5 text-sm text-slate-600 hover:text-brand-800 hover:bg-brand-50 rounded-md transition-colors"
                                onClick={() => setCitiesOpen(false)}
                              >
                                {metro.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Footer of dropdown */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href="/map"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-900 transition-colors"
                      onClick={() => setCitiesOpen(false)}
                    >
                      <Map className="w-4 h-4" />
                      View all on map
                    </Link>
                    <span className="text-xs text-slate-400">
                      {metros.length} metros
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guides */}
            <Link href="/guides/travel-nurse-housing" className="nav-link inline-flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              Guides
            </Link>

            {/* Rent Estimate */}
            <Link href="/rent-estimate" className="nav-link inline-flex items-center gap-1.5">
              <Calculator className="w-4 h-4" />
              Rent Estimate
            </Link>

            {/* Map */}
            <Link href="/map" className="nav-link inline-flex items-center gap-1.5">
              <Map className="w-4 h-4" />
              Map
            </Link>
          </nav>

          {/* ── Right side: Search + CTA ── */}
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="p-2 text-slate-400 hover:text-brand-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Search hospitals"
            >
              <Search className="w-5 h-5" />
            </Link>

            <Link
              href="/search"
              className="btn-primary text-sm hidden sm:inline-flex items-center gap-1.5"
            >
              Find Housing
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Nav ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
            {/* Quick links */}
            <div className="flex gap-2">
              <Link
                href="/map"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-brand-50 hover:text-brand-700 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <Map className="w-4 h-4" />
                Map
              </Link>
              <Link
                href="/guides/travel-nurse-housing"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-brand-50 hover:text-brand-700 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <BookOpen className="w-4 h-4" />
                Guides
              </Link>
              <Link
                href="/rent-estimate"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-brand-50 hover:text-brand-700 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <Calculator className="w-4 h-4" />
                Rent Est.
              </Link>
            </div>

            {/* Cities by region */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Cities
              </p>
              <div className="space-y-3">
                {regions.map(({ region, metros: regionMetros }) => (
                  <div key={region}>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide px-1 mb-1">
                      {region}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {regionMetros.map((metro) => (
                        <Link
                          key={metro.slug}
                          href={`/city/${metro.slug}`}
                          className="px-3 py-1.5 text-sm text-slate-600 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 rounded-lg transition-colors"
                          onClick={() => setMobileOpen(false)}
                        >
                          {metro.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/search"
              className="btn-primary text-sm text-center block"
              onClick={() => setMobileOpen(false)}
            >
              Find Housing
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
