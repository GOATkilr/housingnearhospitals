import Link from "next/link";
import { Building2, Search, MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-slate-300" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/search" className="btn-primary text-sm flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Hospitals
          </Link>
          <Link href="/" className="btn-secondary text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
