/**
 * Format currency to Indian Rupee (INR) representation.
 * Example: 150000 -> "₹1,50,000"
 */
export function formatINR(amount: number, compact = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";

  if (compact) {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    if (abs >= 10000000) {
      return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
    }
    if (abs >= 100000) {
      return `${sign}₹${(abs / 100000).toFixed(2)} L`;
    }
    if (abs >= 1000) {
      return `${sign}₹${(abs / 1000).toFixed(1)} K`;
    }
  }

  // Format using Indian locale
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
}

/**
 * Format percentage with explicit +/- sign.
 */
export function formatPct(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0.00%";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}

/**
 * Format ISO datetime string to friendly readable format.
 */
export function formatDate(isoStr: string): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return isoStr;
  }
}

/**
 * Format holding duration to human readable format.
 */
export function formatHorizon(months: number): string {
  if (months === 1) return "1 Month";
  if (months < 12) return `${months} Months`;
  const years = months / 12;
  return years === 1 ? "1 Year" : `${years} Years`;
}
