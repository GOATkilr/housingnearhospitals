"use client";

import { getScoreBand } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { outer: 48, stroke: 4, textSize: "text-sm", labelSize: "text-[10px]" },
  md: { outer: 64, stroke: 5, textSize: "text-lg", labelSize: "text-xs" },
  lg: { outer: 88, stroke: 6, textSize: "text-2xl", labelSize: "text-sm" },
};

export function ScoreRing({ score, size = "md", showLabel = false, className }: ScoreRingProps) {
  const band = getScoreBand(score);
  const config = SIZE_CONFIG[size];
  const radius = (config.outer - config.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className={cn("score-ring flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: config.outer, height: config.outer }}>
        <svg width={config.outer} height={config.outer}>
          {/* Background circle */}
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={config.stroke}
          />
          {/* Progress circle */}
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke={band.color}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold font-mono", config.textSize)} style={{ color: band.color }}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className={cn("font-medium", config.labelSize)} style={{ color: band.color }}>
          {band.label}
        </span>
      )}
    </div>
  );
}
