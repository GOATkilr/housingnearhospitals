"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Building2, Menu, X, Search, MapPin } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

interface MetroLink {
  slug: string;
  name: string;
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [metros, setMetros] = useState<MetroLink[]>([]);

  useEffect(() => {
    fetch("/api/v1/metros")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.data ?? data ?? []) as MetroLink[];
        setMetros(list);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-brand-800 rounded-lg flex items-center justify-center group-hover:bg-brand-700 transition-colors">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 hidden sm:block">
              {SITE_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {metros.map((metro) => (
              <Link
                key={metro.slug}
                href={`/city/${metro.slug}`}
                className="px-3 py-2 text-sm text-slate-600 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors"
              >
                {metro.name}
              </Link>
            ))}
            <Link
              href="/map"
              className="px-3 py-2 text-sm text-slate-600 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <MapPin className="w-4 h-4" />
              Map
            </Link>
          </nav>

          {/* Search + CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="p-2 text-slate-500 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors"
              aria-label="Search hospitals"
            >
              <Search className="w-5 h-5" />
            </Link>
            <Link href="/search" className="btn-primary text-sm hidden sm:block">
              Find Housing
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-700"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-slate-100 mt-2 pt-4">
            <div className="flex flex-col gap-1">
              {metros.map((metro) => (
                <Link
                  key={metro.slug}
                  href={`/city/${metro.slug}`}
                  className="px-3 py-2.5 text-sm text-slate-600 hover:text-brand-800 hover:bg-brand-50 rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  {metro.name}
                </Link>
              ))}
              <Link
                href="/map"
                className="px-3 py-2.5 text-sm text-slate-600 hover:text-brand-800 hover:bg-brand-50 rounded-lg flex items-center gap-1.5"
                onClick={() => setMobileOpen(false)}
              >
                <MapPin className="w-4 h-4" />
                Explore Map
              </Link>
              <Link
                href="/search"
                className="btn-primary text-sm text-center mt-2"
                onClick={() => setMobileOpen(false)}
              >
                Find Housing
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
