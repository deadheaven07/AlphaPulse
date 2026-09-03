import React from "react";

interface AlphaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

export const AlphaLogo: React.FC<AlphaLogoProps> = ({
  size = "md",
  className = "",
  showText = false,
}) => {
  const sizeMap = {
    sm: { box: "w-8 h-8", svg: 24 },
    md: { box: "w-10 h-10", svg: 28 },
    lg: { box: "w-12 h-12", svg: 34 },
    xl: { box: "w-16 h-16", svg: 44 },
  };

  const { box, svg } = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* 3D Geometric Luxury Logo Icon */}
      <div
        className={`relative ${box} rounded-xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 dark:from-surface-dark dark:via-surface-elevated dark:to-canvas-dark p-1.5 flex items-center justify-center border border-emerald-500/30 dark:border-emerald-500/40 shadow-md shadow-emerald-950/20 group cursor-pointer overflow-hidden transition-transform duration-300 hover:scale-105`}
      >
        {/* Ambient Backlight Flare */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-transparent to-amber-500/20 opacity-80 group-hover:opacity-100 transition-opacity" />
        
        {/* Crisp Vector Alpha Horizon Symbol */}
        <svg
          width={svg}
          height={svg}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-300 group-hover:rotate-3"
        >
          <defs>
            {/* Emerald to Gold Radiant Gradient */}
            <linearGradient id="alphaGlow" x1="4" y1="44" x2="44" y2="4" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="45%" stopColor="#10B981" />
              <stop offset="85%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FCD34D" />
            </linearGradient>

            {/* Subtle Metallic Highlight */}
            <linearGradient id="alphaHighlight" x1="12" y1="8" x2="36" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>

            {/* Drop Shadow Filter for 3D Depth */}
            <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#047857" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background Geometry: Dynamic Upward Growth Hexagon / Horizon Bars */}
          <path
            d="M8 36L16 28M18 36L26 28M28 36L36 28"
            stroke="url(#alphaGlow)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.35"
          />

          {/* Primary Stylized Alpha (α) Infinite Horizon Path */}
          <path
            d="M34 14C34 14 31 8 23 8C14.5 8 9 14.5 9 23.5C9 32.5 15 39 23.5 39C31 39 36 33.5 38 27.5L42 15M21 21C18 21 16 23.5 16 27C16 30.5 18.5 32.5 22 32.5C26.5 32.5 32 28 35.5 20.5"
            stroke="url(#alphaGlow)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#logoShadow)"
          />

          {/* Upward Ascending Horizon Apex Arrow */}
          <path
            d="M36 10L42 15L43 9L36 10Z"
            fill="url(#alphaGlow)"
          />

          {/* Golden Ratio Quantum Star Accent */}
          <circle cx="22" cy="14" r="2.2" fill="#FCD34D" className="animate-ping" style={{ transformOrigin: "22px 14px", animationDuration: "3s" }} />
          <circle cx="22" cy="14" r="1.8" fill="#FFFFFF" />
        </svg>

        {/* Glossy Top Glass Sheen */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent rounded-t-xl pointer-events-none" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-sans">
              Alpha<span className="text-emerald-600 dark:text-emerald-400">Pulse</span> India
            </span>
            <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Pro 3D
            </span>
          </div>
          <span className="text-[10px] text-muted dark:text-muted-dark font-medium -mt-0.5">
            Institutional Equity & ROI Engine
          </span>
        </div>
      )}
    </div>
  );
};
