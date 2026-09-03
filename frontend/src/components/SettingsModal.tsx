import React, { useState, useEffect } from "react";
import {
  getCustomApiKey,
  setCustomApiKey,
  fetchSystemDiagnostics,
  testTelegramPing,
  saveTelegramConfig,
  fetchTelegramConfig
} from "../services/api";
import type { DiagnosticSuiteResult } from "../types";
import {
  Key,
  Sparkles,
  X,
  Check,
  ExternalLink,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Send,
  Smartphone,
  BellRing,
  Loader2
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [apiKey, setApiKey] = useState(getCustomApiKey());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"api" | "telegram" | "diagnostics">("api");
  
  // Telegram Configuration State
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestFeedback, setTelegramTestFeedback] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);

  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [diagResult, setDiagResult] = useState<DiagnosticSuiteResult | null>(null);

  // Load existing Telegram configuration on modal open
  useEffect(() => {
    if (isOpen) {
      fetchTelegramConfig()
        .then((cfg) => {
          if (cfg.bot_token) setTelegramToken(cfg.bot_token);
          if (cfg.chat_id) setTelegramChatId(cfg.chat_id);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomApiKey(apiKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onSaved();
      onClose();
    }, 800);
  };

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTelegram(true);
    try {
      await saveTelegramConfig(telegramToken.trim(), telegramChatId.trim());
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onSaved();
      }, 1000);
    } catch {
      setTelegramTestFeedback({ success: false, message: "Failed to save configuration" });
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramToken.trim() || !telegramChatId.trim()) {
      setTelegramTestFeedback({
        success: false,
        message: "Please enter both your Telegram Bot Token and Chat ID first."
      });
      return;
    }
    setIsTestingTelegram(true);
    setTelegramTestFeedback(null);
    try {
      const res = await testTelegramPing(telegramToken.trim(), telegramChatId.trim());
      setTelegramTestFeedback(res);
    } catch {
      setTelegramTestFeedback({
        success: false,
        message: "Network error connecting to backend Telegram service."
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiag(true);
    try {
      const data = await fetchSystemDiagnostics();
      setDiagResult(data);
    } catch (err) {
      console.error("Diagnostic execution error:", err);
    } finally {
      setIsRunningDiag(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-3d-backdrop">
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark shadow-2xl w-full max-w-lg p-6 space-y-5 modal-3d-content transition-colors duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 dark:border-border-dark pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">AlphaPulse Settings & Diagnostics</h2>
              <p className="text-xs text-muted dark:text-muted-dark">AI configuration, Telegram alerts & self-test suite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-border-dark pb-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("api")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "api"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-elevated"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Gemini AI Key</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("telegram")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "telegram"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-elevated"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Telegram Phone Alerts</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("diagnostics");
              if (!diagResult && !isRunningDiag) {
                handleRunDiagnostics();
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "diagnostics"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-elevated"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Self-Check</span>
          </button>
        </div>

        {/* Tab 1: API Configuration */}
        {activeTab === "api" && (
          <form onSubmit={handleSave} className="space-y-4 overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-500" />
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border-dark text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/40 focus:border-emerald-500 bg-slate-50/50 dark:bg-canvas-dark text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-muted dark:text-muted-dark">
                Key is stored locally in your browser and used securely for natural language stock theses.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
              <div className="font-bold text-emerald-900 dark:text-emerald-300">Don't have an API key?</div>
              <p className="text-muted dark:text-muted-dark">
                You can get a free Google Gemini API key at{" "}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 font-bold underline inline-flex items-center gap-0.5"
                >
                  Google AI Studio <ExternalLink className="w-3 h-3" />
                </a>
                . If left blank, the app uses its built-in quantitative heuristic engine.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-elevated cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Saved!
                  </>
                ) : (
                  "Save Key"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Telegram Phone Alerts (Screen-OFF Notifications) */}
        {activeTab === "telegram" && (
          <form onSubmit={handleSaveTelegram} className="space-y-4 overflow-y-auto">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
              <div className="font-extrabold flex items-center gap-1.5 text-xs">
                <BellRing className="w-4 h-4 text-emerald-500" />
                <span>Screen-OFF Instant Phone Audio Alerts</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Connect your free private Telegram Bot. Your phone will ring with <b>Buy Trigger Chimes</b>, <b>Target 1 Victory Chimes</b>, and <b>Stop-Loss Sirens</b> even when your laptop is completely closed!
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                  1. Telegram Bot Token
                </label>
                <input
                  type="text"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="e.g. 7482910482:AAH_d98sfj..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border-dark text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/40 focus:border-emerald-500 bg-slate-50/50 dark:bg-canvas-dark text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-500" />
                  2. Telegram Chat ID
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="e.g. 583920194"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border-dark text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/40 focus:border-emerald-500 bg-slate-50/50 dark:bg-canvas-dark text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 font-sans">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <span>Free 60-Second Setup Guide:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-muted-dark">
                <li>
                  Open Telegram and search for{" "}
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-bold underline inline-flex items-center gap-0.5"
                  >
                    @BotFather <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  . Send <code className="px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 font-mono">/newbot</code> and copy the <b>HTTP API Token</b>.
                </li>
                <li>
                  Search for{" "}
                  <a
                    href="https://t.me/userinfobot"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-bold underline inline-flex items-center gap-0.5"
                  >
                    @userinfobot <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  . Start the bot to see your numeric <b>Id / Chat ID</b>.
                </li>
                <li>
                  Start a chat with your new bot and send <code className="px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 font-mono">/start</code>, then click Test below!
                </li>
              </ol>
            </div>

            {/* Test Feedback Alert */}
            {telegramTestFeedback && (
              <div
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 animate-fade-in ${
                  telegramTestFeedback.success
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                    : "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                }`}
              >
                {telegramTestFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{telegramTestFeedback.message}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-border-dark">
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={isTestingTelegram}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-canvas-dark hover:bg-slate-200 dark:hover:bg-surface-elevated border border-slate-300 dark:border-border-dark text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isTestingTelegram ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                    <span>Pinging Phone...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-emerald-500" />
                    <span>📱 Test Phone Ping</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-elevated cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTelegram}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Saved!
                    </>
                  ) : (
                    "Save Phone Alerts"
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 3: System Health Diagnostics */}
        {activeTab === "diagnostics" && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Run Button & Overall Status Card */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {diagResult ? (
                      <span className={diagResult.overall_status === "HEALTHY" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}>
                        Status: {diagResult.overall_status} ({diagResult.passed}/{diagResult.total_checks} Passing)
                      </span>
                    ) : (
                      "Quant Diagnostics Suite"
                    )}
                  </div>
                  <div className="text-[10px] text-muted dark:text-muted-dark">
                    {diagResult ? `Completed in ${diagResult.total_duration_ms}ms` : "Click below to execute self-test"}
                  </div>
                </div>
              </div>

              <button
                onClick={handleRunDiagnostics}
                disabled={isRunningDiag}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiag ? "animate-spin" : ""}`} />
                <span>{isRunningDiag ? "Testing..." : "Run Test"}</span>
              </button>
            </div>

            {/* Checkpoints List */}
            {isRunningDiag ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 dark:text-muted-dark font-medium">Running in-memory verification across 10 checkpoints...</p>
              </div>
            ) : diagResult ? (
              <div className="space-y-2">
                {diagResult.checks.map((c, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-white dark:bg-surface-elevated border border-slate-100 dark:border-border-dark flex items-start justify-between gap-2 shadow-2xs text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        {c.status === "PASS" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                        <span>{c.name}</span>
                      </div>
                      {c.details && (
                        <p className="text-[11px] text-muted dark:text-muted-dark pl-5">{c.details}</p>
                      )}
                      {c.error && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 pl-5 font-mono">{c.error}</p>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 dark:text-muted-dark shrink-0 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{c.latency_ms}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
