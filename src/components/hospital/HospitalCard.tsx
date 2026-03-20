"use client";

import Link from "next/link";
import Image from "next/image";
import { Building2, Bed, Star, AlertCircle, GraduationCap } from "lucide-react";
import type { Hospital } from "@/types";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";

interface HospitalCardProps {
  hospital: Hospital;
  metroSlug: string;
  className?: string;
}

export function HospitalCard({ hospital, metroSlug, className }: HospitalCardProps) {
  return (
    <Link
      href={`/city/${metroSlug}/${hospital.slug}`}
      className={cn(
        "block bg-white rounded-xl border border-slate-200 p-5 card-hover",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="w-12 h-12 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
          {hospital.imageUrl ? (
            <Image
              src={hospital.imageUrl}
              alt={hospital.name}
              fill
              unoptimized
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <Building2 className="w-6 h-6 text-brand-700" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name */}
          <h3 className="font-semibold text-slate-900 truncate">{hospital.name}</h3>

          {/* System name */}
          {hospital.systemName && (
            <p className="text-sm text-slate-500 mt-0.5">{hospital.systemName}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {/* Type badge */}
            <span className="badge-blue text-[11px]">{hospital.hospitalType}</span>

            {/* Bed count */}
            {hospital.bedCount && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Bed className="w-3.5 h-3.5" />
                {formatNumber(hospital.bedCount)} beds
              </span>
            )}

            {/* CMS Rating */}
            {hospital.cmsOverallRating && (
              <span className="flex items-center gap-0.5 text-xs text-amber-600">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {hospital.cmsOverallRating}/5
              </span>
            )}

            {/* Trauma Level */}
            {hospital.traumaLevel && (
              <span className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5" />
                {hospital.traumaLevel}
              </span>
            )}

            {/* Teaching */}
            {hospital.teachingStatus === "Major" && (
              <span className="flex items-center gap-1 text-xs text-purple-600">
                <GraduationCap className="w-3.5 h-3.5" />
                Teaching
              </span>
            )}
          </div>

          {/* Address */}
          <p className="text-xs text-slate-400 mt-2 truncate">
            {hospital.address}, {hospital.city}, {hospital.stateCode} {hospital.zipCode}
          </p>
        </div>
      </div>
    </Link>
  );
}
