export function normalizeIdentity(value) {
  return String(value || "").trim().toUpperCase();
}

export function formatNumeric(value, maxFractionDigits = 2) {
  if (value === null || value === undefined || value === "") return "-";
  const raw = String(value);
  const sign = raw.startsWith("-") ? "-" : "";
  const unsigned = sign ? raw.slice(1) : raw;
  const [integerPart, fractionPart = ""] = unsigned.split(".");
  const integer = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
  const fraction = fractionPart.slice(0, maxFractionDigits).replace(/0+$/g, "");
  return `${sign}${integer}${fraction ? `.${fraction}` : ""}`;
}

export function formatInteger(value) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value).split(".")[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatAmount(value, maxFractionDigits = 2) {
  return formatNumeric(value, maxFractionDigits);
}

export function formatSignedAmount(value, maxFractionDigits = 2) {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num === 0) return "0";
  return `${num > 0 ? "+" : "-"}${formatAmount(Math.abs(num), maxFractionDigits)}`;
}

export function formatSignedPercent(value, maxFractionDigits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (num === 0) return "0%";
  return `${num > 0 ? "+" : "-"}${formatNumeric(Math.abs(num), maxFractionDigits)}%`;
}

export function formatPercent(value, maxFractionDigits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `${num.toLocaleString("en-US", {
    maximumFractionDigits: maxFractionDigits,
  })}%`;
}

export function formatUsd(value, maxFractionDigits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "-";
  return `$${num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  })}`;
}

export function formatCompactAmount(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "0";

  const units = [
    { suffix: "B", value: 1_000_000_000 },
    { suffix: "M", value: 1_000_000 },
    { suffix: "K", value: 1_000 },
  ];
  const unit = units.find((item) => amount >= item.value);
  if (!unit) return String(Math.round(amount));

  const compact = amount / unit.value;
  const formatted = compact >= 10
    ? Math.round(compact).toString()
    : compact.toFixed(1).replace(/\.0$/, "");
  return `${formatted}${unit.suffix}`;
}

export function formatPrice(value) {
  return formatNumeric(value);
}

export function formatDecimalOdds(price, wholeSharePrice = 100000, maxFractionDigits = 2) {
  const numericPrice = Number(price);
  const numericWholeSharePrice = Number(wholeSharePrice);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0 || !Number.isFinite(numericWholeSharePrice) || numericWholeSharePrice <= 0) {
    return "-";
  }
  return (numericWholeSharePrice / numericPrice).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: maxFractionDigits,
  });
}

export function formatRational(numerator, denominator, maxFractionDigits = 12) {
  try {
    const top = window.BigInt(numerator);
    const bottom = window.BigInt(denominator);
    if (bottom === 0n) return "-";

    const negative = (top < 0n) !== (bottom < 0n);
    const absoluteTop = top < 0n ? -top : top;
    const absoluteBottom = bottom < 0n ? -bottom : bottom;
    const scale = 10n ** window.BigInt(maxFractionDigits);
    const scaled = (absoluteTop * scale + absoluteBottom / 2n) / absoluteBottom;
    const integer = scaled / scale;
    const fraction = (scaled % scale)
      .toString()
      .padStart(maxFractionDigits, "0")
      .replace(/0+$/, "");
    const value = `${integer}${fraction ? `.${fraction}` : ""}`;
    return formatNumeric(`${negative ? "-" : ""}${value}`, maxFractionDigits);
  } catch {
    return "-";
  }
}

export function formatRationalDelta(
  finalNumerator,
  finalDenominator,
  openingNumerator,
  openingDenominator,
  maxFractionDigits = 2,
) {
  try {
    const finalTop = window.BigInt(finalNumerator);
    const finalBottom = window.BigInt(finalDenominator);
    const openingTop = window.BigInt(openingNumerator);
    const openingBottom = window.BigInt(openingDenominator);
    if (finalBottom === 0n || openingBottom === 0n) return null;

    let numerator = finalTop * openingBottom - openingTop * finalBottom;
    let denominator = finalBottom * openingBottom;
    if (denominator < 0n) {
      numerator = -numerator;
      denominator = -denominator;
    }
    return {
      direction: numerator === 0n ? 0 : numerator > 0n ? 1 : -1,
      value: formatRational(numerator, denominator, maxFractionDigits),
    };
  } catch {
    return null;
  }
}

export function formatPricePercent(value) {
  if (value === null || value === undefined || value === "") return "-";
  const price = Number(value);
  if (!Number.isFinite(price)) return "-";
  const percent = price / 1000;
  const minimumFractionDigits = percent > 0 && percent < 0.01 ? 3 : 0;
  return `${percent.toLocaleString("en-US", {
    minimumFractionDigits: Math.min(minimumFractionDigits, 2),
    maximumFractionDigits: 2,
  })}%`;
}

export function formatPriceWithPercent(value) {
  if (value === null || value === undefined || value === "") return "-";
  return `${formatPrice(value)} (${formatPricePercent(value)})`;
}

export function formatDateUtc(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const part = (next) => String(next).padStart(2, "0");
  return `${part(date.getUTCMonth() + 1)}/${part(date.getUTCDate())}/${date.getUTCFullYear()}, ${part(date.getUTCHours())}:${part(date.getUTCMinutes())}:${part(date.getUTCSeconds())}`;
}

export function formatDateUtcMinute(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const part = (next) => String(next).padStart(2, "0");
  return `${part(date.getUTCMonth() + 1)}/${part(date.getUTCDate())}/${date.getUTCFullYear()}, ${part(date.getUTCHours())}:${part(date.getUTCMinutes())}`;
}

export function shortMiddle(value, start = 5, end = 5, minLength = 13) {
  if (!value) return "-";
  const text = String(value);
  return text.length > minLength ? `${text.slice(0, start)}...${text.slice(-end)}` : text;
}

export const shortIdentity = shortMiddle;
export const shortHash = shortMiddle;
