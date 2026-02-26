"use client";

import { useState } from "react";
import { Sun, Moon, Car, Clock } from "lucide-react";
import { formatDriveTime, formatDistance, getScoreBand } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface CommuteBarProps {
  driveTimeDayMin: number;
  driveTimeNightMin: number;
  distanceMiles: number;
  proximityScore: number;
  className?: string;
}

export function CommuteBar({
  driveTimeDayMin,
  driveTimeNightMin,
  distanceMiles,
  proximityScore,
  className,
}: CommuteBarProps) {
  const [shift, setShift] = useState<"day" | "night">("day");
  const driveTime = shift === "day" ? driveTimeDayMin : driveTimeNightMin;
  const band = getScoreBand(proximityScore);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Shift toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShift("day")}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
            shift === "day"
              ? "bg-amber-100 text-amber-800"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Sun className="w-3.5 h-3.5" />
          Day
        </button>
        <button
          onClick={() => setShift("night")}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
            shift === "night"
              ? "bg-indigo-100 text-indigo-800"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Moon className="w-3.5 h-3.5" />
          Night
        </button>
      </div>

      {/* Commute details */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Car className="w-4 h-4" />
          <span className="font-medium">{formatDriveTime(driveTime)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Clock className="w-4 h-4" />
          <span>{formatDistance(distanceMiles)}</span>
        </div>
      </div>

      {/* Visual bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${proximityScore}%`,
            backgroundColor: band.color,
          }}
        />
      </div>
    </div>
  );
}
