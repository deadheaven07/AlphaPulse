import React, { useEffect, useState, useRef } from "react";

interface NumberOdometerProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  animateColor?: boolean;
}

export const NumberOdometer: React.FC<NumberOdometerProps> = ({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  className = "",
  animateColor = true,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [trend, setTrend] = useState<"up" | "down" | null>(null);
  const prevValueRef = useRef<number>(value);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevValueRef.current;
    if (prev !== value) {
      if (value > prev) setTrend("up");
      else if (value < prev) setTrend("down");

      const startTime = performance.now();
      const duration = 650; // ms
      const startVal = displayValue;
      const targetVal = value;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Smooth easeOutCubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = startVal + (targetVal - startVal) * ease;

        setDisplayValue(current);

        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(targetVal);
          prevValueRef.current = targetVal;
          setTimeout(() => setTrend(null), 1000);
        }
      };

      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value]);

  const formattedStr = displayValue.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      className={`inline-flex items-center font-mono transition-colors duration-500 ${
        animateColor && trend === "up"
          ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          : animateColor && trend === "down"
          ? "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
          : ""
      } ${className}`}
    >
      {prefix && <span>{prefix}</span>}
      <span>{formattedStr}</span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
};
