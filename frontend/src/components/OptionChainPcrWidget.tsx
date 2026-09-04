import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOptionChainPcr } from "../services/api";
import { Gauge, Sparkles } from "lucide-react";

export const OptionChainPcrWidget: React.FC = () => {
  const { data: optionPcr } = useQuery({
    queryKey: ["option-chain-pcr-widget"],
    queryFn: fetchOptionChainPcr,
    refetchInterval: 60000,
  });

  if (!optionPcr) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900/80 text-white border border-slate-800 text-xs animate-pulse">
        Fetching live NSE Put-Call Ratio and Max Pain data...
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white border border-emerald-500/40 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                Market Tide Barometer (NSE PCR)
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-300 font-mono font-bold">
                Sensibull Style
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Real-time Open Interest (OI) floor & derivatives sentiment
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 block uppercase">NIFTY PCR</span>
            <span className="text-sm font-black text-emerald-400">{optionPcr.pcr}</span>
          </div>
          <span
            className={`px-2 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
              optionPcr.sentiment_color === "emerald"
                ? "bg-emerald-900/80 text-emerald-300 border border-emerald-500/50"
                : optionPcr.sentiment_color === "rose"
                ? "bg-rose-900/80 text-rose-300 border border-rose-500/50"
                : "bg-teal-900/80 text-teal-300 border border-teal-500/50"
            }`}
          >
            {optionPcr.sentiment.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
            Put OI (Support Floor)
          </span>
          <span className="text-xs font-black text-emerald-400">
            {(optionPcr.total_put_oi / 100000).toFixed(2)}L Contracts
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
            Call OI (Ceiling)
          </span>
          <span className="text-xs font-black text-rose-400">
            {(optionPcr.total_call_oi / 100000).toFixed(2)}L Contracts
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-900/60 space-y-0.5">
          <span className="text-[9px] text-amber-300 font-bold uppercase tracking-wider block">
            Max Pain Magnet
          </span>
          <span className="text-xs font-black text-amber-300">
            ₹{optionPcr.max_pain_strike.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-sans">{optionPcr.verdict}</p>
      </div>
    </div>
  );
};
