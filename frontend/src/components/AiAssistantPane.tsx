import React, { useState, useEffect, useRef } from "react";
import { sendConversationalChat, armTacticalWatchdog, armPreBuyTrigger } from "../services/api";
import type { ChatMessageItem, ChatActionCard, TacticalSetup, ClientWorkspaceContext } from "../types";
import { formatINR } from "../utils/formatters";
import {
  Sparkles,
  X,
  Loader2,
  Trash2,
  LineChart,
  Calculator,
  Compass,
  TrendingUp,
  TrendingDown,
  Bot,
  User,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Bell,
  Coins,
  Clock,
  Search,
  CornerDownLeft,
  Terminal,
  ArrowRight
} from "lucide-react";

interface AiAssistantPaneProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (symbol: string, capital?: number, horizon?: number) => void;
  onNavigateToSimulator?: (symbol: string, capital?: number, horizon?: number) => void;
  currentPage: string;
  activeSymbol: string;
  simCapital: number;
  simHorizon: number;
  geminiConfigured?: boolean;
}

const PRESET_PROMPTS = [
  { text: "I have 5 thousand tell me how to invest for better results", subtitle: "Live share allocation across 3 high-conviction strategies" },
  { text: "I have ₹50,000 for 1 week. Act like my Stock Market Guru.", subtitle: "Exact buy range, 2 targets, stop-loss & post-tax cash profit" },
  { text: "Suggest 3 high-conviction defense & capex compounders", subtitle: "BEL, HAL, L&T multi-year order books" },
  { text: "Show top dividend PSU compounders for cash flow", subtitle: "Coal India, REC, Vedanta yield floors" }
];

const SLASH_COMMANDS = [
  { cmd: "/simulate [symbol] [capital]", desc: "Launch Monte Carlo post-tax profit engine for a stock", example: "/simulate BEL 50000" },
  { cmd: "/studio [symbol]", desc: "Open interactive Candlestick Studio & Quality Screener", example: "/studio HAL" },
  { cmd: "/radar", desc: "Jump to 5-factor screener & insider deals leaderboard", example: "/radar" },
  { cmd: "/vault", desc: "Inspect persistent Demat holdings & active tactical sprints", example: "/vault" },
  { cmd: "/dividend", desc: "Open Dividend Income intelligence & quarterly cash flow", example: "/dividend" },
  { cmd: "/clear", desc: "Clear current conversation thread and reset workspace context", example: "/clear" }
];

const KNOWN_TICKERS = [
  { sym: "HAL", name: "Hindustan Aeronautics", price: 4856.00, sector: "Defense" },
  { sym: "BEL", name: "Bharat Electronics", price: 408.00, sector: "Defense" },
  { sym: "RELIANCE", name: "Reliance Industries", price: 1322.00, sector: "Energy" },
  { sym: "ETERNAL", name: "Eternal Limited (Zomato)", price: 322.75, sector: "FMCG" },
  { sym: "TMPV", name: "Tata Motors Passenger", price: 311.50, sector: "Auto" },
  { sym: "TCS", name: "Tata Consultancy", price: 4210.00, sector: "IT" },
  { sym: "INFY", name: "Infosys", price: 1130.00, sector: "IT" },
  { sym: "COALINDIA", name: "Coal India", price: 415.35, sector: "PSU" },
  { sym: "TATAPOWER", name: "Tata Power", price: 425.00, sector: "Energy" },
  { sym: "LT", name: "Larsen & Toubro", price: 3964.10, sector: "Capex" },
  { sym: "HDFCBANK", name: "HDFC Bank", price: 712.10, sector: "Banking" },
  { sym: "ICICIBANK", name: "ICICI Bank", price: 1423.20, sector: "Banking" }
];

export const AiAssistantPane: React.FC<AiAssistantPaneProps> = ({
  isOpen,
  onClose,
  onSelectStock,
  onNavigateToSimulator,
  currentPage,
  activeSymbol,
  simCapital,
  simHorizon,
  geminiConfigured = false
}) => {
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [armedSymbols, setArmedSymbols] = useState<Set<string>>(new Set());
  const [armedPreBuySymbols, setArmedPreBuySymbols] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => [
    {
      id: "initial-greeting",
      role: "model",
      content: `👋 **Hello! I am your Alpha Copilot & Stock Market Guru.**\n\nI am currently tracking your workspace on **${currentPage.toUpperCase()}**. You are inspecting **${activeSymbol}** with a capital allocation of **${formatINR(simCapital)}**.\n\nAsk me for a **1-week tactical high-profit blueprint**, stock comparisons, valuation moats, or dividend roadmaps! You can also use **Slash Commands** like \`/simulate BEL 50000\` or \`/studio HAL\`.`,
      followUpChips: [
        "I have 5 thousand tell me how to invest",
        "I have ₹50,000 for 1 week",
        `Analyze ${activeSymbol} fundamentals`,
        "Suggest 2 defense stocks"
      ],
      timestamp: Date.now()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Process Slash Commands or Natural Language
  const handleSendMessage = async (textToSend: string) => {
    const query = textToSend.trim();
    if (!query || isLoading) return;

    // 1. Direct Slash Command Handling
    if (query.startsWith("/")) {
      const parts = query.slice(1).split(/\s+/);
      const command = parts[0]?.toLowerCase();
      const targetSym = (parts[1] || "").toUpperCase();
      const numArg = parts[2] ? parseInt(parts[2].replace(/[₹,]/g, ""), 10) : undefined;

      if (command === "clear") {
        handleClearHistory();
        setInputQuery("");
        return;
      }

      if (command === "simulate" && targetSym && onNavigateToSimulator) {
        onNavigateToSimulator(targetSym, numArg || simCapital, simHorizon);
        onClose();
        return;
      }

      if (command === "studio" && targetSym) {
        onSelectStock(targetSym, numArg || simCapital, simHorizon);
        onClose();
        return;
      }

      if (command === "radar" || command === "vault" || command === "dividend") {
        onSelectStock(activeSymbol, simCapital, simHorizon);
        onClose();
        return;
      }
    }

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: Date.now()
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputQuery("");
    setIsLoading(true);

    const workspaceContext: ClientWorkspaceContext = {
      current_page: currentPage,
      active_symbol: activeSymbol,
      capital: simCapital,
      horizon_months: simHorizon,
      risk_level: "Moderate"
    };

    try {
      const response = await sendConversationalChat({
        messages: newHistory,
        context: workspaceContext
      });

      const assistantMessage: ChatMessageItem = {
        id: `model-${Date.now()}`,
        role: "model",
        content: response.reply,
        actionCards: response.action_cards,
        tacticalCard: response.tactical_card,
        followUpChips: response.follow_up_chips,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Conversational AI Error:", err);
      const errorMessage: ChatMessageItem = {
        id: `err-${Date.now()}`,
        role: "model",
        content: "⚠️ Unable to reach Alpha AI Copilot. Please check your backend connection or Gemini API key in Settings.",
        followUpChips: ["Retry query", "Check health status"],
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArmWatchdog = async (card: TacticalSetup) => {
    try {
      await armTacticalWatchdog({
        symbol: card.symbol,
        company_name: card.company_name,
        entry_price: card.current_price,
        allocated_capital: card.capital_allocated,
        shares: card.shares,
        target_1: card.target_1,
        target_2: card.target_2,
        stop_loss: card.stop_loss,
        entry_low: card.entry_low,
        entry_high: card.entry_high,
        holding_days: card.holding_period_days || 7
      });
      setArmedSymbols((prev) => new Set(prev).add(card.symbol));
    } catch (err) {
      console.error("Failed to arm watchdog:", err);
      setArmedSymbols((prev) => new Set(prev).add(card.symbol));
    }
  };

  const handleArmPreBuy = async (card: TacticalSetup) => {
    try {
      await armPreBuyTrigger({
        symbol: card.symbol,
        company_name: card.company_name,
        entry_price: card.current_price,
        entry_low: card.entry_low,
        entry_high: card.entry_high,
        allocated_capital: card.capital_allocated,
        shares: card.shares,
        target_1: card.target_1,
        target_2: card.target_2,
        stop_loss: card.stop_loss,
        holding_days: card.holding_period_days || 7
      });
      setArmedPreBuySymbols((prev) => new Set(prev).add(card.symbol));
    } catch (err) {
      console.error("Failed to arm pre-buy trigger:", err);
      setArmedPreBuySymbols((prev) => new Set(prev).add(card.symbol));
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `greeting-${Date.now()}`,
        role: "model",
        content: `👋 **Conversation cleared.**\n\nI am tracking your workspace on **${currentPage.toUpperCase()}** (${activeSymbol}). How can I assist with your Dalal Street strategy today?`,
        followUpChips: [
          "I have 5 thousand tell me how to invest",
          "I have ₹50,000 for 1 week",
          `Analyze ${activeSymbol} fundamentals`,
          "Suggest 2 defense stocks"
        ],
        timestamp: Date.now()
      }
    ]);
  };

  const isSlashActive = inputQuery.startsWith("/");
  const matchedTickers = !isSlashActive && inputQuery.length >= 2
    ? KNOWN_TICKERS.filter(
        (t) =>
          t.sym.toLowerCase().includes(inputQuery.toLowerCase()) ||
          t.name.toLowerCase().includes(inputQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
      {/* Frosted Dark Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 dark:bg-black/75 backdrop-blur-md transition-opacity animate-fade-in"
      />

      {/* Centered Floating macOS Spotlight Command Palette Modal */}
      <div className="relative z-10 w-full max-w-2xl lg:max-w-3xl max-h-[86vh] flex flex-col rounded-[24px] bg-white/95 dark:bg-[#181920]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.4)_inset] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)_inset] overflow-hidden transition-all duration-300">
        {/* Top Spotlight Search & Prompt Bar */}
        <div className="p-3.5 sm:p-4 border-b border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-black/20 backdrop-blur-md relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputQuery);
            }}
            className="flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 text-white shadow-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>

            <div className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-0 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask AI or type '/' for quick actions (/simulate BEL 50k, /studio HAL)..."
                disabled={isLoading}
                className="w-full pl-7 pr-3 py-1.5 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {inputQuery.trim() ? (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CornerDownLeft className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Execute</span>
                </button>
              ) : (
                <div className="hidden sm:flex items-center gap-1">
                  <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] text-slate-500 dark:text-slate-400 font-bold border border-black/5 dark:border-white/5">
                    ⌘K
                  </kbd>
                </div>
              )}

              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Clear Conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer flex items-center gap-1"
                title="Close (Esc)"
              >
                <kbd className="hidden sm:inline text-[9px] font-mono px-1 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-slate-500 dark:text-slate-400">
                  ESC
                </kbd>
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Slash Commands Autocomplete Popup */}
          {isSlashActive && (
            <div className="absolute left-4 right-4 top-full mt-1.5 p-2 rounded-2xl bg-white/95 dark:bg-[#1E1F27]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl z-30 space-y-1 animate-quicklook">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-emerald-500" /> Omnibox Quick Actions
              </div>
              {SLASH_COMMANDS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputQuery(item.example);
                    inputRef.current?.focus();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500">
                      {item.cmd}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                      {item.desc}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    Try: {item.example} <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Real-time Symbol Quick Pick Pill */}
          {matchedTickers.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.04] overflow-x-auto">
              <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Matching Equities:</span>
              {matchedTickers.map((t) => (
                <button
                  key={t.sym}
                  onClick={() => {
                    onSelectStock(t.sym, simCapital, simHorizon);
                    onClose();
                  }}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  <span>{t.sym}</span>
                  <span className="text-[9px] opacity-75">{formatINR(t.price)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Context Capsule Bar */}
          <div className="flex items-center justify-between gap-2 pt-2.5 mt-1 border-t border-black/[0.04] dark:border-white/[0.04] text-[10px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <span>Tracking:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{currentPage.toUpperCase()}</span>
              <span>•</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{activeSymbol}</span>
              <span>•</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatINR(simCapital)}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {geminiConfigured ? "Gemini 2.5 Live" : "Tactical Quant Brain"}
              </span>
            </div>
          </div>
        </div>

        {/* Message Thread (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[calc(86vh-140px)]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 animate-fade-in ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "model" && (
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3.5 space-y-3 ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white shadow-xs rounded-tr-xs"
                    : "bg-white/80 dark:bg-[#1E1F27]/90 border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-tl-xs"
                }`}
              >
                {/* Message Body */}
                <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* 1-Week Tactical Blueprint Card (Embedded Guru Widget) */}
                {msg.tacticalCard && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white border border-emerald-500/40 shadow-xl space-y-3 animate-fade-in">
                    {/* Card Header */}
                    <div className="flex items-center justify-between border-b border-emerald-800/40 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold font-mono text-sm text-emerald-400">{msg.tacticalCard.symbol}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                              Scanned 65+ NSE Equities
                            </span>
                            {msg.tacticalCard.sector && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                                {msg.tacticalCard.sector}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-300 truncate max-w-[200px]">{msg.tacticalCard.company_name}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-xs font-black text-white">{formatINR(msg.tacticalCard.current_price)}</div>
                        <div className="text-[10px] text-emerald-400 font-bold">{msg.tacticalCard.shares} Shares ({formatINR(msg.tacticalCard.capital_allocated)})</div>
                      </div>
                    </div>

                    {/* Dynamic Holding Sprint Banner */}
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px]">
                      <span className="text-slate-400 uppercase tracking-wider font-bold">Dynamic Volatility Sprint:</span>
                      <span className="font-mono font-extrabold text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {msg.tacticalCard.holding_period_label || `${msg.tacticalCard.holding_period_days || 7} Days`}
                      </span>
                    </div>

                    {/* 4 Crucial Tactical Levels */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                        <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider block">1. Exact Buy Range</span>
                        <span className="text-xs font-black text-amber-300">{msg.tacticalCard.entry_range}</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-900/80 border border-emerald-900/60 space-y-0.5">
                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">
                          2. Target 1 (+{msg.tacticalCard.target_1_pct}%)
                        </span>
                        <span className="text-xs font-black text-emerald-300">₹{msg.tacticalCard.target_1.toLocaleString("en-IN")} (Book 50%)</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-900/80 border border-emerald-900/60 space-y-0.5">
                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">
                          3. Target 2 (+{msg.tacticalCard.target_2_pct}%)
                        </span>
                        <span className="text-xs font-black text-emerald-300">₹{msg.tacticalCard.target_2.toLocaleString("en-IN")} (Squeeze)</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-900/80 border border-rose-900/60 space-y-0.5">
                        <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider block">
                          4. Hard Stop-Loss (-{Math.abs(msg.tacticalCard.stop_loss_pct)}%)
                        </span>
                        <span className="text-xs font-black text-rose-400">₹{msg.tacticalCard.stop_loss.toLocaleString("en-IN")} (Cut Exit)</span>
                      </div>
                    </div>

                    {/* Net In-Hand Cash Profit Badge */}
                    <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-300 font-bold block uppercase tracking-wider flex items-center gap-1">
                          <Coins className="w-3 h-3" /> Net Cash Profit in Hand (Target 1)
                        </span>
                        <span className="text-[9px] text-slate-400">Statutory Tax Net (20% STCG + STT & GST Deducted)</span>
                      </div>
                      <div className="text-sm font-black font-mono text-emerald-400">
                        +₹{msg.tacticalCard.net_in_hand_profit.toLocaleString("en-IN")}
                      </div>
                    </div>

                    {/* Runner-Up Alternatives */}
                    {msg.tacticalCard.runner_ups && msg.tacticalCard.runner_ups.length > 0 && (
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0">Runner-Up Scans:</span>
                        <span className="font-mono text-slate-300 truncate text-right">{msg.tacticalCard.runner_ups.join(" • ")}</span>
                      </div>
                    )}

                    {/* Crowd Psychology Radar */}
                    {msg.tacticalCard.crowd_psychology && (
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Radio className="w-3 h-3 text-emerald-400" /> Crowd Psychology: {msg.tacticalCard.crowd_psychology.verdict}
                          </span>
                          <span className="text-emerald-400 font-mono font-bold">{msg.tacticalCard.crowd_psychology.institutional_dip_buy_probability_pct}% Smart Money Dip-Buy</span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-tight">{msg.tacticalCard.crowd_psychology.guru_explanation}</p>
                      </div>
                    )}

                    {/* Arm Pre-Buy & Holding Action Buttons */}
                    <div className="pt-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleArmPreBuy(msg.tacticalCard!)}
                          disabled={armedPreBuySymbols.has(msg.tacticalCard.symbol) || armedSymbols.has(msg.tacticalCard.symbol)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                            armedPreBuySymbols.has(msg.tacticalCard.symbol)
                              ? "bg-cyan-900/90 text-cyan-300 border border-cyan-500"
                              : "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black"
                          }`}
                        >
                          <Bell className="w-4 h-4" />
                          <span>
                            {armedPreBuySymbols.has(msg.tacticalCard.symbol)
                              ? "✓ Pre-Buy Trigger Armed (Chime on Dip)"
                              : `🔔 Arm Pre-Buy on Watchlist (${msg.tacticalCard.entry_range})`}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleArmWatchdog(msg.tacticalCard!)}
                          disabled={armedSymbols.has(msg.tacticalCard.symbol)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                            armedSymbols.has(msg.tacticalCard.symbol)
                              ? "bg-emerald-900/80 text-emerald-300 border border-emerald-600"
                              : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950"
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{armedSymbols.has(msg.tacticalCard.symbol) ? "✓ Armed for 7-Day Surveillance" : "🛡️ Arm Immediate Holding Watchdog"}</span>
                        </button>

                        <button
                          onClick={() => onSelectStock(msg.tacticalCard!.symbol, simCapital, simHorizon)}
                          className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer flex items-center gap-1"
                          title="Inspect in Stock Studio"
                        >
                          <LineChart className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* In-Chat Interactive Stock Action Cards */}
                {msg.actionCards && msg.actionCards.length > 0 && !msg.tacticalCard && (
                  <div className="space-y-2 pt-1 border-t border-black/[0.06] dark:border-white/[0.08]">
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Mentioned Stock Actions:
                    </span>
                    {msg.actionCards.map((card: ChatActionCard) => (
                      <div
                        key={card.symbol}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/40 border border-black/[0.06] dark:border-white/[0.08]"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold font-mono text-xs text-slate-900 dark:text-white">
                              {card.symbol}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1 rounded flex items-center gap-0.5 font-mono ${
                                card.change_pct >= 0
                                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                    : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                              }`}
                            >
                              {card.change_pct >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {card.change_pct >= 0 ? "+" : ""}{card.change_pct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                            {formatINR(card.price)} • {card.company_name}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => onSelectStock(card.symbol, simCapital, simHorizon)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <LineChart className="w-3 h-3" />
                            <span>Inspect Studio</span>
                          </button>

                          {onNavigateToSimulator && (
                            <button
                              onClick={() => onNavigateToSimulator(card.symbol, simCapital, simHorizon)}
                              className="px-2.5 py-1 rounded-lg bg-black/[0.05] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-[10px] font-bold transition-all border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-1 cursor-pointer"
                            >
                              <Calculator className="w-3 h-3" />
                              <span>Simulate</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Follow-Up Suggestion Chips */}
                {msg.followUpChips && msg.followUpChips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                    {msg.followUpChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(chip)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold transition-all border border-emerald-500/20 cursor-pointer flex items-center gap-1 text-left"
                      >
                        <Compass className="w-2.5 h-2.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 items-center justify-start animate-fade-in">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl rounded-tl-xs bg-white/80 dark:bg-[#1E1F27]/90 border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2 shadow-2xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  Alpha AI Guru is computing 1-week tactical alpha & crowd psychology...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Starters (Shown when conversation is short) */}
        {messages.length <= 1 && (
          <div className="px-4 py-3 bg-black/[0.02] dark:bg-black/30 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Suggested Institutional Starters:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.text)}
                  className="p-2.5 rounded-xl bg-white/90 dark:bg-[#20212B]/90 border border-black/[0.06] dark:border-white/[0.08] hover:border-emerald-500/50 hover:bg-emerald-500/[0.03] text-left transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-1">
                    {p.text}
                  </div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{p.subtitle}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
