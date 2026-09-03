import React, { useState, useMemo } from "react";
import { formatINR } from "../utils/formatters";
import {
  Target,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Flame,
  Send,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Radio,
  BookOpen
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSavedGoals,
  saveGoalPlan,
  deleteGoalPlan,
  askPlanCopilot,
  fetchGoalBasketNews
} from "../services/api";
import type { GoalBasketStock, GoalAiCopilotResponse } from "../types";

interface GoalPlannerPageProps {
  onNavigateToStudio: (symbol: string) => void;
}

const PRESET_TARGETS = [
  { label: "₹2 Lakhs", value: 200000 },
  { label: "₹5 Lakhs", value: 500000 },
  { label: "₹10 Lakhs", value: 1000000 },
  { label: "₹25 Lakhs", value: 2500000 },
  { label: "₹50 Lakhs", value: 5000000 },
  { label: "₹1 Crore", value: 10000000 },
];

const PRESET_HORIZONS = [
  { label: "6 Months", months: 6, tag: "Tactical Sprint" },
  { label: "1 Year", months: 12, tag: "Fast Track" },
  { label: "2 Years", months: 24, tag: "Targeted Growth" },
  { label: "3 Years", months: 36, tag: "Compounding" },
  { label: "5 Years", months: 60, tag: "Wealth Creation" },
];

const PRESET_PROMPTS = [
  "🎯 Plan ₹10 Lakhs in 2 Years with Moderate Risk",
  "⚡ Fast ₹2 Lakhs in 6 Months (Aggressive Momentum)",
  "🛡️ Safe ₹25 Lakhs Retirement (Conservative Dividend Engine)",
  "🚀 Maximize ₹50,000 monthly SIP for 3 Years",
];

export const GoalPlannerPage: React.FC<GoalPlannerPageProps> = ({
  onNavigateToStudio,
}) => {

  const queryClient = useQueryClient();

  // Configurator State
  const [goalTitle, setGoalTitle] = useState("My Primary Wealth Milestone");
  const [targetAmount, setTargetAmount] = useState<number>(1000000);
  const [startingCapital, setStartingCapital] = useState<number>(150000);
  const [monthlySip, setMonthlySip] = useState<number>(15000);
  const [horizonMonths, setHorizonMonths] = useState<number>(24);
  const [riskLevel, setRiskLevel] = useState<"Conservative" | "Moderate" | "Aggressive">("Moderate");
  const [activeBasket, setActiveBasket] = useState<GoalBasketStock[]>([
    { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Auto & EV", allocation_pct: 30, expected_cagr_pct: 19.5 },
    { symbol: "LT", name: "Larsen & Toubro", sector: "Infrastructure", allocation_pct: 25, expected_cagr_pct: 18.0 },
    { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", allocation_pct: 25, expected_cagr_pct: 17.5 },
    { symbol: "COALINDIA", name: "Coal India", sector: "Energy / Dividend", allocation_pct: 20, expected_cagr_pct: 15.0 },
  ]);

  // AI Chat State
  const [userQuery, setUserQuery] = useState("");
  const [copilotResponse, setCopilotResponse] = useState<GoalAiCopilotResponse | null>(null);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [trackSuccessMsg, setTrackSuccessMsg] = useState("");

  // Queries & Mutations
  const { data: savedGoals = [] } = useQuery({
    queryKey: ["saved-goals"],
    queryFn: fetchSavedGoals,
  });

  const saveGoalMutation = useMutation({
    mutationFn: saveGoalPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-goals"] });
      setTrackSuccessMsg("🎯 Goal Plan successfully saved and tracked in your Demat Vault!");
      setTimeout(() => setTrackSuccessMsg(""), 4000);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: deleteGoalPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-goals"] });
    },
  });

  // Basket symbols for bottom news stream
  const basketSymbolsStr = useMemo(() => {
    return activeBasket.map((b) => b.symbol).join(",");
  }, [activeBasket]);

  const { data: basketNews = [], isLoading: isLoadingNews } = useQuery({
    queryKey: ["goal-basket-news", basketSymbolsStr],
    queryFn: () => fetchGoalBasketNews(basketSymbolsStr),
    enabled: Boolean(basketSymbolsStr),
    refetchInterval: 30000,
  });

  // Mathematical Projections
  const years = Math.max(0.5, horizonMonths / 12.0);
  const totalInvested = startingCapital + monthlySip * horizonMonths;
  const requiredCagrPct = useMemo(() => {
    if (totalInvested <= 0 || targetAmount <= totalInvested) return 0;
    return Math.round(((targetAmount / totalInvested) ** (1.0 / years) - 1.0) * 1000) / 10;
  }, [targetAmount, totalInvested, years]);


  // Feasibility assessment
  const feasibility = useMemo(() => {
    if (requiredCagrPct <= 12) {
      return { score: 94, label: "Very High Feasibility", color: "emerald", desc: "Easily achievable with standard Indian Index / Dividend compounders." };
    }
    if (requiredCagrPct <= 20) {
      return { score: 85, label: "Optimal Institutional CAGR", color: "indigo", desc: "Solid risk-adjusted target matching top Nifty 50 leaders." };
    }
    if (requiredCagrPct <= 35) {
      return { score: 68, label: "High Growth Required", color: "amber", desc: "Requires tactical allocation in high-beta capex & momentum leaders." };
    }
    return { score: 42, label: "Aggressive Speculative Stretch", color: "rose", desc: "Consider increasing monthly SIP or extending timeline to avoid excessive drawdown risk." };
  }, [requiredCagrPct]);

  // Handle AI query
  const handleAskCopilot = async (overridePrompt?: string) => {
    const promptToAsk = overridePrompt || userQuery;
    if (!promptToAsk.trim()) return;

    setIsCopilotLoading(true);
    try {
      const resp = await askPlanCopilot({
        query: promptToAsk,
        target_amount: targetAmount,
        starting_capital: startingCapital,
        monthly_sip: monthlySip,
        horizon_months: horizonMonths,
        risk_level: riskLevel,
      });
      setCopilotResponse(resp);
      if (resp.recommended_basket && resp.recommended_basket.length > 0) {
        setActiveBasket(resp.recommended_basket);
      }
      if (!overridePrompt) setUserQuery("");
    } catch (err) {
      console.error("Failed to query AI copilot:", err);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // Handle saving goal
  const handleSaveGoal = () => {
    saveGoalMutation.mutate({
      title: goalTitle,
      target_amount: targetAmount,
      starting_capital: startingCapital,
      monthly_sip: monthlySip,
      horizon_months: horizonMonths,
      risk_level: riskLevel,
      planned_basket: activeBasket,
      notes: `Target: ₹${targetAmount.toLocaleString("en-IN")} in ${horizonMonths}M (${riskLevel} risk)`,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border dark:border-border-dark pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              Institutional Financial Planner
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              Goal & Strategy Architect
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            My Financial Plan & Wealth Targets
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Define your financial target, tune speed and risk appetite, and have the AI generate an institutional asset allocation basket with real-time news & threat monitoring.
          </p>
        </div>

        {trackSuccessMsg && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-slide-in-left shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{trackSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP SECTION: AI WEALTH COPILOT ADVISOR */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-900/10 via-white to-emerald-900/10 dark:from-indigo-950/40 dark:via-surface-dark dark:to-emerald-950/40 border border-indigo-500/30 dark:border-indigo-500/20 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Alpha Wealth Copilot (AI Strategy Advisor)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                  Gemini 2.5 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Ask any goal or milestone query. The AI computes feasibility and builds a customized basket.
              </p>
            </div>
          </div>
        </div>

        {/* Preset Prompt Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (prompt.includes("₹10 Lakhs")) {
                  setTargetAmount(1000000);
                  setHorizonMonths(24);
                  setRiskLevel("Moderate");
                } else if (prompt.includes("₹2 Lakhs")) {
                  setTargetAmount(200000);
                  setHorizonMonths(6);
                  setRiskLevel("Aggressive");
                } else if (prompt.includes("₹25 Lakhs")) {
                  setTargetAmount(2500000);
                  setHorizonMonths(60);
                  setRiskLevel("Conservative");
                }
                handleAskCopilot(prompt);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/80 dark:bg-surface-elevated/80 border border-slate-200 dark:border-border-dark text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-102 transition-all shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskCopilot()}
            placeholder="e.g. Plan ₹15 Lakhs for my child's education in 3 years with Moderate risk..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-canvas-dark border border-slate-200 dark:border-border-dark text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-medium"
          />
          <button
            onClick={() => handleAskCopilot()}
            disabled={isCopilotLoading || !userQuery.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 text-white font-bold text-xs flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 shadow-md"
          >
            {isCopilotLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Computing...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Ask Copilot</span>
              </>
            )}
          </button>
        </div>

        {/* AI Response Card */}
        {copilotResponse && (
          <div className="mt-5 p-5 rounded-xl bg-white dark:bg-surface-elevated/90 border border-indigo-500/30 dark:border-border-dark shadow-sm animate-fade-in space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border dark:border-border-dark pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                  Strategy Verdict & Blueprint
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-500">Required CAGR:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {copilotResponse.required_cagr_pct}% / yr
                </span>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line prose prose-invert max-w-none">
              {copilotResponse.ai_thesis}
            </div>

            {/* Recommended Basket Chips */}
            {copilotResponse.recommended_basket && (
              <div className="pt-2 border-t border-border dark:border-border-dark">
                <div className="text-xs font-extrabold uppercase text-slate-500 mb-2">
                  Recommended Strategy Basket:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {copilotResponse.recommended_basket.map((stock, sIdx) => (
                    <div
                      key={sIdx}
                      onClick={() => onNavigateToStudio(stock.symbol)}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark hover:border-indigo-500 cursor-pointer transition-all hover:scale-102"
                      title="Click to deep dive in Stock Studio"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                          {stock.symbol}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {stock.allocation_pct}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{stock.name}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 font-bold">
                        Exp. CAGR: ~{stock.expected_cagr_pct}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. MIDDLE SECTION: INTERACTIVE GOAL CONFIGURATOR & TRACKER */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              Goal Milestone Configurator
            </h2>
            <span className="text-xs font-mono text-slate-500">Live Mathematical Projection</span>
          </div>

          {/* Goal Title Input */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Goal Name</label>
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-50 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Target Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Target Corpus Goal</label>
              <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatINR(targetAmount)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_TARGETS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTargetAmount(t.value)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                    targetAmount === t.value
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-slate-50 dark:bg-surface-elevated border-slate-200 dark:border-border-dark text-slate-700 dark:text-slate-300 hover:border-emerald-500"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={50000}
              max={10000000}
              step={50000}
              value={targetAmount}
              onChange={(e) => setTargetAmount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Starting Capital & Monthly SIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Starting Capital (Lump Sum)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={startingCapital}
                  onChange={(e) => setStartingCapital(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-7 pr-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Monthly SIP Contribution
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={monthlySip}
                  onChange={(e) => setMonthlySip(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-7 pr-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Time Horizon ("How Fast I Want") */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Time Horizon & Speed
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PRESET_HORIZONS.map((h) => (
                <button
                  key={h.months}
                  onClick={() => setHorizonMonths(h.months)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    horizonMonths === h.months
                      ? "bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 shadow-2xs"
                      : "bg-slate-50 dark:bg-canvas-dark border-slate-200 dark:border-border-dark hover:border-slate-300"
                  }`}
                >
                  <div className="text-xs font-black text-slate-900 dark:text-white">{h.label}</div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    {h.tag}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Risk Level Appetite */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Risk Tolerance & Strategy Matrix
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => {
                  setRiskLevel("Conservative");
                  setActiveBasket([
                    { symbol: "COALINDIA", name: "Coal India", sector: "Mining/Dividend", allocation_pct: 30, expected_cagr_pct: 14.0 },
                    { symbol: "ITC", name: "ITC Ltd", sector: "FMCG", allocation_pct: 25, expected_cagr_pct: 13.5 },
                    { symbol: "TCS", name: "Tata Consultancy", sector: "IT", allocation_pct: 25, expected_cagr_pct: 15.0 },
                    { symbol: "RECLTD", name: "REC Ltd", sector: "Power Finance", allocation_pct: 20, expected_cagr_pct: 16.0 },
                  ]);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  riskLevel === "Conservative"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-2xs"
                    : "bg-slate-50 dark:bg-canvas-dark border-slate-200 dark:border-border-dark hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-400 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Conservative
                </div>
                <div className="text-[11px] text-slate-500">
                  High dividend yield (5.5%) + blue-chip low beta floor.
                </div>
              </button>

              <button
                onClick={() => {
                  setRiskLevel("Moderate");
                  setActiveBasket([
                    { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Auto & EV", allocation_pct: 30, expected_cagr_pct: 19.5 },
                    { symbol: "LT", name: "Larsen & Toubro", sector: "Infrastructure", allocation_pct: 25, expected_cagr_pct: 18.0 },
                    { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", allocation_pct: 25, expected_cagr_pct: 17.5 },
                    { symbol: "COALINDIA", name: "Coal India", sector: "Energy / Dividend", allocation_pct: 20, expected_cagr_pct: 15.0 },
                  ]);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  riskLevel === "Moderate"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 shadow-2xs"
                    : "bg-slate-50 dark:bg-canvas-dark border-slate-200 dark:border-border-dark hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-700 dark:text-indigo-400 mb-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Moderate (Balanced)
                </div>
                <div className="text-[11px] text-slate-500">
                  Infrastructure capex + Nifty leaders with dividend buffer.
                </div>
              </button>

              <button
                onClick={() => {
                  setRiskLevel("Aggressive");
                  setActiveBasket([
                    { symbol: "BEL", name: "Bharat Electronics", sector: "Defense", allocation_pct: 30, expected_cagr_pct: 24.0 },
                    { symbol: "HAL", name: "Hindustan Aero", sector: "Defense Aero", allocation_pct: 25, expected_cagr_pct: 26.0 },
                    { symbol: "TATAPOWER", name: "Tata Power", sector: "Renewables", allocation_pct: 25, expected_cagr_pct: 22.0 },
                    { symbol: "ZOMATO", name: "Zomato", sector: "Quick Commerce", allocation_pct: 20, expected_cagr_pct: 28.0 },
                  ]);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  riskLevel === "Aggressive"
                    ? "bg-rose-50 dark:bg-rose-950/60 border-rose-500 shadow-2xs"
                    : "bg-slate-50 dark:bg-canvas-dark border-slate-200 dark:border-border-dark hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700 dark:text-rose-400 mb-0.5">
                  <Flame className="w-3.5 h-3.5" />
                  Aggressive
                </div>
                <div className="text-[11px] text-slate-500">
                  High-beta defense & quick-commerce breakout picks.
                </div>
              </button>
            </div>
          </div>

          {/* Action Button: Track This Goal */}
          <div className="pt-2">
            <button
              onClick={handleSaveGoal}
              disabled={saveGoalMutation.isPending}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-98 disabled:opacity-50"
            >
              <Target className="w-4 h-4" />
              <span>
                {saveGoalMutation.isPending ? "Saving Plan..." : "Track This Goal in My Vault"}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Feasibility Gauge & Active Tracked Goals (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Feasibility & Probability Card */}
          <div className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-border dark:border-border-dark pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Probability & Math Engine
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-${feasibility.color}-500/10 text-${feasibility.color}-600 dark:text-${feasibility.color}-400 border border-${feasibility.color}-500/20`}
              >
                {feasibility.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark">
                <div className="text-[10px] uppercase font-bold text-slate-500">Required CAGR</div>
                <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {requiredCagrPct}%
                  <span className="text-xs font-normal text-slate-400"> /yr</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark">
                <div className="text-[10px] uppercase font-bold text-slate-500">Total Capital Invested</div>
                <div className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {formatINR(totalInvested, true)}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 mb-4">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-indigo-900 dark:text-indigo-200">
                  Target Corpus: {formatINR(targetAmount)}
                </span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.min(100, Math.round((totalInvested / targetAmount) * 100))}% Funded by SIP
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-surface-elevated h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalInvested / targetAmount) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2">
                {feasibility.desc}
              </p>
            </div>

            {/* Planned Stock Basket Breakdown */}
            <div>
              <div className="text-xs font-extrabold uppercase text-slate-500 mb-2">
                Active Planned Basket ({activeBasket.length} Stocks)
              </div>
              <div className="space-y-2">
                {activeBasket.map((stock, idx) => (
                  <div
                    key={idx}
                    onClick={() => onNavigateToStudio(stock.symbol)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark hover:border-emerald-500 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {stock.symbol}
                      </div>
                      <div className="text-[10px] text-slate-500">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {stock.allocation_pct}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatINR((targetAmount * stock.allocation_pct) / 100, true)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Saved Tracked Goals List */}
          <div className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center justify-between">
              <span>My Active Tracked Goals ({savedGoals.length})</span>
              <span className="text-[10px] font-mono text-slate-400 font-normal">SQLite Vault</span>
            </h3>

            {savedGoals.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border dark:border-border-dark rounded-xl">
                <Target className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">No Saved Goals Yet</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Click "Track This Goal in My Vault" above to persist your plan.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {savedGoals.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">{g.title}</div>
                      <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatINR(g.target_amount)} in {g.horizon_months}M ({g.risk_level})
                      </div>
                    </div>
                    <button
                      onClick={() => g.id && deleteGoalMutation.mutate(g.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM SECTION: REAL-TIME NEWS, CATALYST & THREAT RADAR */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 border-b border-border dark:border-border-dark pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Live News & Threat Radar for Planned Basket
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Real-time NSE market updates, earnings reports, and regulatory developments filtered strictly for your basket ({basketSymbolsStr}).
            </p>
          </div>

          <span className="text-[11px] font-mono text-slate-500">
            Auto-refreshing every 30s
          </span>
        </div>

        {isLoadingNews ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-border-dark animate-pulse space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-surface-elevated rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-surface-elevated rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : basketNews.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border dark:border-border-dark rounded-xl">
            <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
              No High-Risk News Threats Detected
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Your planned basket is trading with positive institutional sentiment equilibrium.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {basketNews.map((news, nIdx) => (
              <div
                key={nIdx}
                className="p-4 rounded-xl bg-slate-50/70 dark:bg-canvas-dark/70 border border-slate-200 dark:border-border-dark hover:border-emerald-500/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-surface-elevated text-slate-900 dark:text-white">
                        {news.symbol}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {news.publisher} • {news.published}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono ${
                        news.sentiment.toLowerCase().includes("bullish")
                          ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300"
                          : news.sentiment.toLowerCase().includes("bearish") || news.sentiment.toLowerCase().includes("risk")
                          ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300"
                          : "bg-slate-200 dark:bg-surface-elevated text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {news.sentiment}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-1.5">
                    {news.title}
                  </h4>

                  {news.summary && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {news.summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/60 dark:border-border-dark/60 text-[11px]">
                  <div className="flex items-center gap-1 text-slate-500 font-mono">
                    <span>Loss Risk:</span>
                    <span
                      className={`font-bold ${
                        news.risk_of_loss_pct > 35
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {news.risk_of_loss_pct}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onNavigateToStudio(news.symbol)}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      Analyze {news.symbol}
                    </button>
                    {news.link && news.link !== "#" && (
                      <a
                        href={news.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
