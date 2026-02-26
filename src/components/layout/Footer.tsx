import Link from "next/link";
import { Building2 } from "lucide-react";
import { SITE_NAME, SITE_TAGLINE, LAUNCH_METROS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">{SITE_NAME}</span>
            </div>
            <p className="text-sm">{SITE_TAGLINE}</p>
          </div>

          {/* Cities */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Cities</h4>
            <ul className="space-y-2">
              {LAUNCH_METROS.map((metro) => (
                <li key={metro.slug}>
                  <Link
                    href={`/city/${metro.slug}`}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {metro.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/travel-nurse-housing" className="text-sm hover:text-white transition-colors">
                  Travel Nurse Guide
                </Link>
              </li>
              <li>
                <Link href="/map" className="text-sm hover:text-white transition-colors">
                  Map Explorer
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-sm hover:text-white transition-colors">
                  Search Hospitals
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-sm text-center">
          &copy; {new Date().getFullYear()} {SITE_NAME}. Built for healthcare workers.
        </div>
      </div>
    </footer>
  );
}
