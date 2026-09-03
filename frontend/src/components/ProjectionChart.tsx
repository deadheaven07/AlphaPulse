import React from "react";
import type { TrajectoryPoint } from "../types";
import { formatINR } from "../utils/formatters";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import { Layers } from "lucide-react";

interface ProjectionChartProps {
  trajectory: TrajectoryPoint[];
  symbol?: string;
  capital?: number;
}

export const ProjectionChart: React.FC<ProjectionChartProps> = ({ trajectory }) => {
  // Normalize points to standard keys
  const normalizedData = trajectory?.map((pt: any) => ({
    ...pt,
    bull_val: pt.bull_val !== undefined ? pt.bull_val : pt.bull_value,
    base_val: pt.base_val !== undefined ? pt.base_val : pt.base_value,
    bear_val: pt.bear_val !== undefined ? pt.bear_val : pt.bear_value,
  })) || [];

  return (
    <div className="glass-panel-3d rounded-2xl p-4 sm:p-6 space-y-4 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 dark:border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              1,000-Path Monte Carlo Portfolio Projection (₹)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              90% Empirical Confidence
            </span>
          </div>
          <p className="text-xs text-muted dark:text-slate-400">
            Stochastic capital compounding timeline with 90th (Bull), 50th (Base Median), and 10th (Bear / VaR) percentile confidence bands
          </p>
        </div>
      </div>

      <div className="h-72 sm:h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={normalizedData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.30} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="bearGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.20} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#94A3B8" }}
              axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94A3B8" }}
              axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
              tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 border border-border dark:border-slate-700">
                      <div className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                        Timeline Milestone: {data.label}
                      </div>
                      <div className="flex items-center justify-between gap-4 text-profit-600 dark:text-profit-400 font-mono font-bold">
                        <span>Bull (90th %ile):</span>
                        <span>{formatINR(data.bull_val)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-brand-600 dark:text-brand-400 font-mono font-bold">
                        <span>Base (50th %ile):</span>
                        <span>{formatINR(data.base_val)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-risk-600 dark:text-risk-400 font-mono font-bold">
                        <span>Bear / VaR (10th %ile):</span>
                        <span>{formatINR(data.bear_val)}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
            />
            <Area
              name="Bull Case (90th)"
              type="monotone"
              dataKey="bull_val"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#bullGrad)"
            />
            <Area
              name="Base Consensus (50th)"
              type="monotone"
              dataKey="base_val"
              stroke="#6366F1"
              strokeWidth={2.5}
              fill="url(#baseGrad)"
            />
            <Area
              name="Bear Drawdown (10th)"
              type="monotone"
              dataKey="bear_val"
              stroke="#F43F5E"
              strokeWidth={2}
              fill="url(#bearGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
