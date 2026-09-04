import React from "react";

interface ProbabilityBarProps {
  label: string;
  hitPct: number;     // % chance of hitting target (e.g., target 1)
  stopPct: number;    // % chance of stop-loss triggering
  targetPct: number;  // target return percentage (e.g., +6.5)
  stopLossPct: number; // stop-loss percentage (e.g., 2.5)
  className?: string;
}

export const ProbabilityBar: React.FC<ProbabilityBarProps> = ({
  label,
  hitPct,
  stopPct,
  targetPct,
  stopLossPct,
  className
}) => {
  const totalWidth = 100;
  const hitWidth = Math.max(0, Math.min(100, hitPct));
  const stopWidth = Math.max(0, Math.min(100, stopPct));
  const remainingWidth = totalWidth - hitWidth - stopWidth;

  return (
    <div className={`p-3 rounded-xl bg-slate-950/80 border border-slate-700/50 ${className}`}>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] font-semibold text-slate-400">{label}</span>
        <span className="text-[10px] text-slate-500">
          {hitPct.toFixed(1)}% hit • {stopPct.toFixed(1)}% stop
        </span>
      </div>

      <div className="h-2 rounded-full bg-slate-800/50 relative overflow-hidden">
        <div
          className="h-full bg-emerald-600/70 rounded-l-full transition-all duration-750 ease-out"
          style={{ width: `${hitWidth}%` }}
          aria-label="Probability of hitting target"
          title={`${hitPct.toFixed(1)}% chance of hitting target +${targetPct.toFixed(1)}% return`}
        />
        <div
          className="h-full bg-rose-600/70 rounded-r-full transition-all duration-750 ease-out"
          style={{ width: `${stopWidth}%` }}
          aria-label="Probability of stop-loss triggering"
          title={`${stopPct.toFixed(1)}% chance of stop-loss triggering at -${stopLossPct.toFixed(1)}%`}
        />
        <div
          className="h-full bg-slate-600/50 absolute left-0 top-0 bottom-0"
          style={{ width: `${remainingWidth}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500">
        <span>+{targetPct.toFixed(1)}% TP</span>
        <span>-{stopLossPct.toFixed(1)}% SL</span>
      </div>
    </div>
  );
};