"use client";

/**
 * Dev-only placeholder that shows where an ad zone will appear.
 * Renders a dashed border box with a label in development mode.
 * Renders nothing in production.
 */
export function AdPlaceholder({ zone, className = "" }: { zone: string; className?: string }) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div
      className={`border-2 border-dashed border-slate-300 rounded-lg p-3 flex items-center justify-center text-xs text-slate-400 font-mono ${className}`}
    >
      Ad: {zone}
    </div>
  );
}
