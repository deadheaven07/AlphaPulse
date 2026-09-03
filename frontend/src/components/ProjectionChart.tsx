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
  horizonMonths: number;
}

export const ProjectionChart: React.FC<ProjectionChartProps> = ({ trajectory, horizonMonths }) => {
  // Normalize points to standard keys
  const normalizedData = trajectory?.map((pt: any) => ({
    ...pt,
    bull_val: pt.bull_val !== undefined ? pt.bull_val : pt.bull_value,
    base_val: pt.base_val !== undefined ? pt.base_val : pt.base_value,
    bear_val: pt.bear_val !== undefined ? pt.bear_val : pt.bear_value,
  })) || [];

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              1,000-Path Monte Carlo Portfolio Projection (₹)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              90% Empirical Confidence
            </span>
          </div>
          <p className="text-xs text-muted">
            Stochastic capital compounding timeline from Month 0 to Month {horizonMonths} with 90th, 50th, and 10th percentile bands
          </p>
        </div>
      </div>

      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={normalizedData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="bearGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              axisLine={{ stroke: "#E2E8F0" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              axisLine={{ stroke: "#E2E8F0" }}
              tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass-panel p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 border border-border">
                      <div className="font-bold text-slate-800 border-b border-slate-100 pb-1">
                        Timeline Milestone: {data.label}
                      </div>
                      <div className="flex items-center justify-between gap-4 text-profit-600 font-mono font-bold">
                        <span>Bull (90th %tile):</span>
                        <span>{formatINR(data.bull_val)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-brand-600 font-mono font-bold">
                        <span>Base (50th %tile):</span>
                        <span>{formatINR(data.base_val)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-risk-600 font-mono font-bold">
                        <span>Bear / VaR (10th %tile):</span>
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
              formatter={(value) => {
                if (value === "bull_val") return <span className="text-xs font-bold text-profit-700">Bull 90th %tile</span>;
                if (value === "base_val") return <span className="text-xs font-bold text-brand-700">Base 50th %tile</span>;
                return <span className="text-xs font-bold text-risk-700">Bear 10th %tile (VaR)</span>;
              }}
            />
            <Area
              type="monotone"
              dataKey="bull_val"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#bullGrad)"
            />
            <Area
              type="monotone"
              dataKey="base_val"
              stroke="#4F46E5"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#baseGrad)"
            />
            <Area
              type="monotone"
              dataKey="bear_val"
              stroke="#F43F5E"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#bearGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
