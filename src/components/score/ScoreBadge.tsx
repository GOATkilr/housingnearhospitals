"use client";

import { getScoreBand } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const band = getScoreBand(score);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        className
      )}
      style={{ backgroundColor: band.bgColor, color: band.color }}
    >
      <span className="font-mono">{score}</span>
      <span>{band.label}</span>
    </span>
  );
}
