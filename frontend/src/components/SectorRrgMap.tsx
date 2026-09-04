import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSectorRrgMatrix, armPreBuyTrigger } from "../services/api";
import type { SectorRrgData, SectorConstituentStock } from "../types";
import { formatINR, formatPct } from "../utils/formatters";
import {
  Compass,
  Sparkles,
  TrendingUp,
  Layers,
  LineChart,
  Calculator,
  Bell,
  Flame,
  CheckCircle2,
  Clock
} from "lucide-react";

interface SectorRrgMapProps {
  currentSectorRrg?: SectorRrgData;
  activeStockSymbol: string;
  onSelectSymbol?: (symbol: string) => void;
  onNavigateToSimulator?: (symbol?: string) => void;
}

type TimeframeType = "1w" | "1m" | "1y";

export const SectorRrgMap: React.FC<SectorRrgMapProps> = ({
  currentSectorRrg,
  activeStockSymbol,
  onSelectSymbol,
  onNavigateToSimulator,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeType>("1w");
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [armedSymbols, setArmedSymbols] = useState<Set<string>>(new Set());

  // 1. Fetch live multi-timeframe RRG matrix
  const { data: matrixData } = useQuery({
    queryKey: ["sector-rrg-matrix", timeframe],
    queryFn: () => fetchSectorRrgMatrix(timeframe),
    refetchInterval: 60000,
  });

  const sectors = useMemo(() => matrixData?.sectors || [], [matrixData?.sectors]);

  // Determine currently selected sector item
  const activeSector = useMemo(() => {
    if (!sectors.length) return null;
    if (selectedSectorId) {
      const found = sectors.find((s) => s.id === selectedSectorId || s.name.toLowerCase().includes(selectedSectorId.toLowerCase()));
      if (found) return found;
    }
    // Fallback to currently inspected stock's sector
    if (currentSectorRrg?.sector) {
      const match = sectors.find((s) => s.name.toLowerCase().includes(currentSectorRrg.sector.toLowerCase()) || currentSectorRrg.sector.toLowerCase().includes(s.name.toLowerCase()));
      if (match) return match;
    }
    // Fallback to top #1 sector
    return sectors[0];
  }, [sectors, selectedSectorId, currentSectorRrg]);

  // Coordinate mapping for 2D Scatter Quadrant Grid
  // Dynamic scale centered at (100, 100)
  const minX = 94.0, maxX = 116.0;
  const minY = 96.0, maxY = 110.0;

  const toCoords = (rsRatio: number, rsMom: number) => {
    const xPct = Math.min(94, Math.max(6, ((rsRatio - minX) / (maxX - minX)) * 100));
    const yPct = Math.min(94, Math.max(6, 100 - ((rsMom - minY) / (maxY - minY)) * 100));
    return { xPct, yPct };
  };

  const centerCoords = toCoords(100.0, 100.0);

  const handleArmPreBuy = async (stock: SectorConstituentStock) => {
    try {
      await armPreBuyTrigger({
        symbol: stock.symbol,
        company_name: stock.name,
        entry_price: stock.ltp,
        entry_low: Math.round(stock.ltp * 0.98 * 100) / 100,
        entry_high: Math.round(stock.ltp * 1.005 * 100) / 100,
        target_1: Math.round(stock.ltp * 1.06 * 100) / 100,
        target_2: Math.round(stock.ltp * 1.12 * 100) / 100,
        stop_loss: Math.round(stock.ltp * 0.96 * 100) / 100,
        allocated_capital: 50000,
        shares: Math.max(1, Math.floor(50000 / stock.ltp)),
        holding_days: timeframe === "1y" ? 30 : (timeframe === "1m" ? 14 : 7)
      });
      setArmedSymbols((prev) => new Set(prev).add(stock.symbol));
    } catch (err) {
      console.error("Failed to arm pre-buy:", err);
      setArmedSymbols((prev) => new Set(prev).add(stock.symbol));
    }
  };

  return (
    <div className="glass-panel-3d rounded-2xl p-4 sm:p-6 space-y-6 transition-all duration-300">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Relative Rotation Graph (RRG Sector Quadrants)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                11 NSE Sectors
              </span>
            </div>
            <p className="text-xs text-muted dark:text-slate-400">
              Interactive 2D Relative Strength (RS-Ratio) vs Momentum (RS-Mom) normalized against the NIFTY 50 benchmark
            </p>
          </div>
        </div>

        {/* Timeframe Selector (1W, 1M, 1Y) */}
        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark shadow-2xs">
            <button
              onClick={() => setTimeframe("1w")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                timeframe === "1w"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>1 Week (Tactical)</span>
            </button>

            <button
              onClick={() => setTimeframe("1m")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                timeframe === "1m"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>1 Month (Swing)</span>
            </button>

            <button
              onClick={() => setTimeframe("1y")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                timeframe === "1y"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>1 Year (Macro)</span>
            </button>
          </div>

          {currentSectorRrg && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>{activeStockSymbol} Sector: {currentSectorRrg.quadrant}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. 2D Quadrant Scatter Grid */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 overflow-hidden select-none p-4 shadow-inner">
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
          className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-slate-900 dark:bg-white border-2 border-white dark:border-slate-900 z-10 shadow-md flex items-center justify-center"
          style={{ left: `${centerCoords.xPct}%`, top: `${centerCoords.yPct}%` }}
          title="NIFTY 50 Benchmark Origin (100, 100)"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>

        {/* Scatter Nodes for All 11 Sectors */}
        {sectors.map((sec) => {
          const { xPct, yPct } = toCoords(sec.rs_ratio, sec.rs_momentum);
          const isSelected = activeSector?.id === sec.id;
          const isCurrentActive =
            currentSectorRrg?.sector && sec.name.toLowerCase().includes(currentSectorRrg.sector.toLowerCase());

          return (
            <div
              key={sec.id}
              onClick={() => setSelectedSectorId(sec.id)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 group z-20 cursor-pointer ${
                isSelected ? "scale-115 z-40" : "hover:scale-105"
              }`}
              style={{ left: `${xPct}%`, top: `${yPct}%` }}
            >
              <div
                className={`px-3 py-1.5 rounded-xl text-xs font-black font-mono flex items-center gap-1.5 shadow-lg transition-all ${
                  isSelected
                    ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 ring-4 ring-emerald-500/50 shadow-xl"
                    : isCurrentActive
                    ? "bg-emerald-700 text-white ring-2 ring-emerald-400"
                    : sec.quadrant === "Leading"
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : sec.quadrant === "Improving"
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : sec.quadrant === "Weakening"
                    ? "bg-amber-600 text-white hover:bg-amber-500"
                    : "bg-rose-600 text-white hover:bg-rose-500"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-emerald-400 animate-ping" : "bg-white/90"}`} />
                <span>{sec.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  sec.return_pct >= 0 ? "bg-black/30 text-emerald-300" : "bg-black/30 text-rose-300"
                }`}>
                  {formatPct(sec.return_pct)}
                </span>
                {isSelected && (
                  <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded font-black uppercase">
                    Active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Quick Sector Filter Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            Click any sector to inspect constituents (Sorted Most Profitable First):
          </span>
          <span className="text-[11px] font-mono font-bold text-muted dark:text-muted-dark">
            NIFTY 50 {timeframe.toUpperCase()}: {formatPct(matrixData?.benchmark_return_pct || 2.2)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {sectors.map((sec) => {
            const isSelected = activeSector?.id === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSectorId(sec.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md scale-105"
                    : sec.quadrant === "Leading"
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100"
                    : sec.quadrant === "Improving"
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100"
                    : sec.quadrant === "Weakening"
                    ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100"
                    : "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/80 hover:bg-rose-100"
                }`}
              >
                <span>{sec.name}</span>
                <span className="font-mono text-[10px] opacity-80">({formatPct(sec.return_pct)})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive Constituent Stocks Breakdown Table (ARRANGED MOST PROFITABLE FIRST) */}
      {activeSector && (
        <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg space-y-3 p-4 sm:p-5 animate-fade-in">
          {/* Active Sector Summary Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 dark:border-slate-800 pb-3.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{activeSector.name} Constituent Stocks</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {activeSector.stock_count} Stocks
                  </span>
                </h4>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  activeSector.quadrant === "Leading"
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    : activeSector.quadrant === "Improving"
                    ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800"
                    : activeSector.quadrant === "Weakening"
                    ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                    : "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                }`}>
                  {activeSector.quadrant} Quadrant
                </span>
              </div>
              <p className="text-xs text-muted dark:text-slate-400 max-w-3xl">
                {activeSector.description}
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs self-start sm:self-auto">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right">
                <span className="text-[10px] text-muted dark:text-slate-400 block uppercase">Sector {timeframe.toUpperCase()} Return</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {formatPct(activeSector.return_pct)}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right">
                <span className="text-[10px] text-muted dark:text-slate-400 block uppercase">Alpha vs Nifty</span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {formatPct(activeSector.outperformance_vs_nifty_pct)}
                </span>
              </div>
            </div>
          </div>

          {/* Constituent Table (Ranked Most Profitable First) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-border/80 dark:border-slate-800 text-muted dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Rank & Stock</th>
                  <th className="py-2.5 px-3">Live Price (LTP)</th>
                  <th className="py-2.5 px-3">{timeframe.toUpperCase()} Profit / Return</th>
                  <th className="py-2.5 px-3">Quality & Delivery</th>
                  <th className="py-2.5 px-3">Dalal Street Catalyst</th>
                  <th className="py-2.5 px-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {activeSector.stocks.map((stk: SectorConstituentStock, idx: number) => {
                  const isInspected = stk.symbol === activeStockSymbol;
                  const isArmed = armedSymbols.has(stk.symbol);

                  return (
                    <tr
                      key={stk.symbol}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors ${
                        isInspected ? "bg-emerald-50/60 dark:bg-emerald-950/20" : ""
                      }`}
                    >
                      {/* Rank & Symbol */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black ${
                            idx === 0
                              ? "bg-amber-400 text-slate-950 shadow-xs"
                              : idx === 1
                              ? "bg-slate-300 text-slate-900"
                              : idx === 2
                              ? "bg-amber-700 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 dark:text-white font-mono">
                                {stk.symbol}
                              </span>
                              {isInspected && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                  Current
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted dark:text-slate-400 block truncate max-w-[150px]">
                              {stk.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* LTP & Day % */}
                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatINR(stk.ltp)}
                        </div>
                        <div className={`text-[11px] font-bold ${
                          stk.day_change_pct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}>
                          {formatPct(stk.day_change_pct)} (Today)
                        </div>
                      </td>

                      {/* Timeframe Return (Most Profitable First) */}
                      <td className="py-3 px-3 font-mono">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black shadow-2xs">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{formatPct(stk.timeframe_return_pct)} ({timeframe.toUpperCase()})</span>
                        </div>
                      </td>

                      {/* Quality & Delivery */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-muted dark:text-slate-400">Piotroski:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {stk.piotroski_score}/9
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-muted dark:text-slate-400">Delivery:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {stk.delivery_pct}%
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Catalyst Thesis */}
                      <td className="py-3 px-3 max-w-xs">
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                          {stk.catalyst}
                        </p>
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect in Studio */}
                          <button
                            onClick={() => onSelectSymbol && onSelectSymbol(stk.symbol)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            title={`Inspect ${stk.symbol} in Quantitative Studio`}
                          >
                            <LineChart className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Inspect</span>
                          </button>

                          {/* Simulate Monte Carlo */}
                          <button
                            onClick={() => {
                              if (onSelectSymbol) onSelectSymbol(stk.symbol);
                              if (onNavigateToSimulator) onNavigateToSimulator(stk.symbol);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 shadow-2xs"
                            title={`Run Monte Carlo simulation for ${stk.symbol}`}
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Simulate</span>
                          </button>

                          {/* Arm Pre-Buy */}
                          <button
                            onClick={() => handleArmPreBuy(stk)}
                            disabled={isArmed}
                            className={`p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                              isArmed
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 opacity-80"
                                : "bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 shadow-2xs"
                            }`}
                            title="Arm Pre-Buy Watchdog Trigger"
                          >
                            {isArmed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Bell className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
