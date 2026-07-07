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

export function shortMiddle(value, start = 5, end = 5, minLength = 13) {
  if (!value) return "-";
  const text = String(value);
  return text.length > minLength ? `${text.slice(0, start)}...${text.slice(-end)}` : text;
}

export const shortIdentity = shortMiddle;
export const shortHash = shortMiddle;
