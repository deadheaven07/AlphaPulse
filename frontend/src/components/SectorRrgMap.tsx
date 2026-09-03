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

  // Convert (RS-Ratio, RS-Momentum) from [95..110] x [96..106] to percentage [0..100%]
  const minX = 95.0, maxX = 110.0;
  const minY = 96.0, maxY = 106.0;

  const toCoords = (rsRatio: number, rsMom: number) => {
    const xPct = Math.min(95, Math.max(5, ((rsRatio - minX) / (maxX - minX)) * 100));
    // SVG Y is inverted (top is 0)
    const yPct = Math.min(95, Math.max(5, 100 - ((rsMom - minY) / (maxY - minY)) * 100));
    return { xPct, yPct };
  };

  const centerCoords = toCoords(100.0, 100.0);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Relative Rotation Graph (RRG Sector Quadrants)
            </h3>
            <p className="text-xs text-muted">
              Sector RS-Ratio & RS-Momentum normalized against the NIFTY 50 benchmark
            </p>
          </div>
        </div>

        {currentSectorRrg && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200 self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>{activeStockSymbol} Sector: {currentSectorRrg.quadrant}</span>
          </div>
        )}
      </div>

      {/* 2D Quadrant Scatter Grid */}
      <div className="relative w-full h-72 rounded-2xl bg-slate-50 border border-slate-200/80 overflow-hidden select-none p-4">
        {/* Background Quadrant Tints */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {/* Top Left: Improving */}
          <div className="bg-indigo-500/[0.04] border-r border-b border-dashed border-slate-300 relative p-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              Improving (Bottoming)
            </span>
          </div>
          {/* Top Right: Leading */}
          <div className="bg-emerald-500/[0.04] border-b border-dashed border-slate-300 relative p-3 text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Leading (Outperforming)
            </span>
          </div>
          {/* Bottom Left: Lagging */}
          <div className="bg-rose-500/[0.04] border-r border-dashed border-slate-300 relative p-3 flex items-end">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
              Lagging (Underperforming)
            </span>
          </div>
          {/* Bottom Right: Weakening */}
          <div className="bg-amber-500/[0.04] relative p-3 flex items-end justify-end">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
              Weakening (Consolidating)
            </span>
          </div>
        </div>

        {/* Center Benchmark Crosshair Axis (100, 100) */}
        <div
          className="absolute top-0 bottom-0 w-px bg-slate-300"
          style={{ left: `${centerCoords.xPct}%` }}
        />
        <div
          className="absolute left-0 right-0 h-px bg-slate-300"
          style={{ top: `${centerCoords.yPct}%` }}
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-slate-400/20 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-500 font-mono"
          style={{ left: `${centerCoords.xPct}%`, top: `${centerCoords.yPct}%` }}
        >
          100
        </div>

        {/* Sector Data Points */}
        {ALL_SECTORS.map((sector) => {
          const isCurrentActive =
            currentSectorName.toLowerCase().includes(sector.name.toLowerCase()) ||
            sector.name.toLowerCase().includes(currentSectorName.toLowerCase());

          const { xPct, yPct } = toCoords(sector.rs_ratio, sector.rs_momentum);

          return (
            <div
              key={sector.name}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group z-10"
              style={{ left: `${xPct}%`, top: `${yPct}%` }}
            >
              {isCurrentActive && (
                <div className="absolute -inset-2 rounded-full bg-brand-500/20 animate-ping" />
              )}

              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-bold shadow-sm transition-transform cursor-pointer group-hover:scale-110 border ${
                  isCurrentActive
                    ? "bg-brand-600 text-white border-brand-700 ring-2 ring-brand-400"
                    : sector.quadrant === "Leading"
                    ? "bg-white text-emerald-700 border-emerald-300"
                    : sector.quadrant === "Improving"
                    ? "bg-white text-indigo-700 border-indigo-300"
                    : sector.quadrant === "Weakening"
                    ? "bg-white text-amber-700 border-amber-300"
                    : "bg-white text-rose-700 border-rose-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCurrentActive
                      ? "bg-white"
                      : sector.quadrant === "Leading"
                      ? "bg-emerald-500"
                      : sector.quadrant === "Improving"
                      ? "bg-indigo-500"
                      : sector.quadrant === "Weakening"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                />
                <span>{sector.name}</span>
                {isCurrentActive && <span className="text-[10px] ml-0.5 font-mono">({activeStockSymbol})</span>}
              </div>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 pointer-events-none">
                <div className="bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 whitespace-nowrap shadow-xl font-mono">
                  RS-Ratio: {sector.rs_ratio} | RS-Mom: {sector.rs_momentum}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] text-muted pt-1">
        <span>X-Axis: Relative Strength Ratio (Benchmark = 100)</span>
        <span>Y-Axis: Relative Strength Momentum (Rate of Change = 100)</span>
      </div>
    </div>
  );
};
