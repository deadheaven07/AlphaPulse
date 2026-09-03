import React from "react";
import type { SectorRrgData } from "../types";
import { Compass, Sparkles } from "lucide-react";

interface SectorRrgMapProps {
  currentSectorRrg?: SectorRrgData;
  activeStockSymbol: string;
}

interface SectorPoint {
  name: string;
  rs_ratio: number;
  rs_momentum: number;
  quadrant: "Leading" | "Improving" | "Weakening" | "Lagging";
}

const ALL_SECTORS: SectorPoint[] = [
  { name: "Auto & EV", rs_ratio: 104.2, rs_momentum: 102.5, quadrant: "Leading" },
  { name: "Defense", rs_ratio: 108.5, rs_momentum: 103.8, quadrant: "Leading" },
  { name: "Infrastructure", rs_ratio: 103.8, rs_momentum: 101.4, quadrant: "Leading" },
  { name: "Energy & Power", rs_ratio: 105.1, rs_momentum: 102.0, quadrant: "Leading" },
  { name: "Retail & Consumer", rs_ratio: 102.4, rs_momentum: 98.6, quadrant: "Weakening" },
  { name: "Banking", rs_ratio: 99.4, rs_momentum: 101.8, quadrant: "Improving" },
  { name: "IT Services", rs_ratio: 97.2, rs_momentum: 98.4, quadrant: "Lagging" },
  { name: "Pharma & Healthcare", rs_ratio: 98.8, rs_momentum: 101.2, quadrant: "Improving" },
];

export const SectorRrgMap: React.FC<SectorRrgMapProps> = ({
  currentSectorRrg,
  activeStockSymbol,
}) => {
  const currentSectorName = currentSectorRrg?.sector || "";

  // Convert (RS-Ratio, RS-Momentum) to percentage [0..100%]
  const minX = 95.0, maxX = 110.0;
  const minY = 96.0, maxY = 106.0;

  const toCoords = (rsRatio: number, rsMom: number) => {
    const xPct = Math.min(95, Math.max(5, ((rsRatio - minX) / (maxX - minX)) * 100));
    const yPct = Math.min(95, Math.max(5, 100 - ((rsMom - minY) / (maxY - minY)) * 100));
    return { xPct, yPct };
  };

  const centerCoords = toCoords(100.0, 100.0);

  return (
    <div className="glass-panel-3d rounded-2xl p-4 sm:p-6 space-y-4 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Relative Rotation Graph (RRG Sector Quadrants)
            </h3>
            <p className="text-xs text-muted dark:text-slate-400">
              Sector RS-Ratio & RS-Momentum normalized against the NIFTY 50 benchmark
            </p>
          </div>
        </div>

        {currentSectorRrg && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-bold border border-brand-200 dark:border-brand-800 self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>{activeStockSymbol} Sector: {currentSectorRrg.quadrant}</span>
          </div>
        )}
      </div>

      {/* 2D Quadrant Scatter Grid */}
      <div className="relative w-full h-72 sm:h-80 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 overflow-hidden select-none p-4">
        {/* Background Quadrant Tints */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {/* Top Left: Improving */}
          <div className="bg-indigo-500/[0.04] dark:bg-indigo-500/[0.08] border-r border-b border-dashed border-slate-300 dark:border-slate-800 relative p-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900">
              Improving (Bottoming)
            </span>
          </div>
          {/* Top Right: Leading */}
          <div className="bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] border-b border-dashed border-slate-300 dark:border-slate-800 relative p-3 text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900">
              Leading (Outperforming)
            </span>
          </div>
          {/* Bottom Left: Lagging */}
          <div className="bg-rose-500/[0.04] dark:bg-rose-500/[0.08] border-r border-dashed border-slate-300 dark:border-slate-800 relative p-3 flex items-end">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900">
              Lagging (Underperforming)
            </span>
          </div>
          {/* Bottom Right: Weakening */}
          <div className="bg-amber-500/[0.04] dark:bg-amber-500/[0.08] relative p-3 flex items-end justify-end">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-900">
              Weakening (Consolidating)
            </span>
          </div>
        </div>

        {/* Benchmark Center Axis (100, 100) */}
        <div
          className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-slate-900 dark:bg-white border-2 border-white dark:border-slate-900 z-10 shadow-xs"
          style={{ left: `${centerCoords.xPct}%`, top: `${centerCoords.yPct}%` }}
          title="NIFTY 50 Benchmark Center (100, 100)"
        />

        {/* Scatter Nodes for Sectors */}
        {ALL_SECTORS.map((sec) => {
          const { xPct, yPct } = toCoords(sec.rs_ratio, sec.rs_momentum);
          const isCurrentActive =
            currentSectorName && sec.name.toLowerCase().includes(currentSectorName.toLowerCase());

          return (
            <div
              key={sec.name}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 group z-20 ${
                isCurrentActive ? "scale-110 z-30" : "hover:scale-105"
              }`}
              style={{ left: `${xPct}%`, top: `${yPct}%` }}
            >
              <div
                className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold font-mono flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                  isCurrentActive
                    ? "bg-slate-900 dark:bg-brand-500 text-white ring-4 ring-brand-500/20 shadow-glow-cyan"
                    : sec.quadrant === "Leading"
                    ? "bg-emerald-600 text-white shadow-emerald-500/25"
                    : sec.quadrant === "Improving"
                    ? "bg-indigo-600 text-white shadow-indigo-500/25"
                    : sec.quadrant === "Weakening"
                    ? "bg-amber-600 text-white shadow-amber-500/25"
                    : "bg-rose-600 text-white shadow-rose-500/25"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white/90" />
                <span>{sec.name}</span>
                {isCurrentActive && <span className="text-[9px] bg-white text-slate-900 dark:bg-slate-900 dark:text-white px-1 rounded uppercase">Active</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* RRG Rotation Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-bold">
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow-emerald" />
          <span>Leading (Outperforming)</span>
        </div>
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-glow-cyan" />
          <span>Improving (Bottoming)</span>
        </div>
        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-glow-amber" />
          <span>Weakening (Consolidating)</span>
        </div>
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-glow-rose" />
          <span>Lagging (Underperforming)</span>
        </div>
      </div>
    </div>
  );
};
