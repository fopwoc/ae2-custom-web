export function formatAmount(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
    value,
  );
}

const compactAmountUnits = [
  { threshold: 1_000_000_000, suffix: "b" },
  { threshold: 1_000_000, suffix: "m" },
  { threshold: 1_000, suffix: "k" },
] as const;

export function formatCompactAmount(value: number): string {
  const sign = value < 0 ? "−" : "";
  const magnitude = Math.abs(value);
  const unit = compactAmountUnits.find(
    ({ threshold }) => magnitude >= threshold,
  );
  if (!unit) return `${sign}${Math.trunc(magnitude)}`;

  const scaled = magnitude / unit.threshold;
  const precision = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return `${sign}${Number(scaled.toFixed(precision))}${unit.suffix}`;
}

export function parseCompactAmount(value: string): number | null {
  const match = value.trim().match(/^(\d+(?:[.,]\d+)?)\s*([kmb])?$/i);
  if (!match) return null;

  const numeric = Number(match[1]!.replace(",", "."));
  const multiplier =
    match[2]?.toLowerCase() === "b"
      ? 1_000_000_000
      : match[2]?.toLowerCase() === "m"
        ? 1_000_000
        : match[2]?.toLowerCase() === "k"
          ? 1_000
          : 1;
  const result = Math.floor(numeric * multiplier);
  return Number.isSafeInteger(result) && result > 0 ? result : null;
}

export function formatBytes(value: number): string {
  return `${formatAmount(value)} B`;
}

export function formatDuration(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "—";
  const seconds = Math.floor(milliseconds / 1_000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function formatDate(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function itemNamespace(itemId: string): string {
  return itemId.includes(":") ? itemId.slice(0, itemId.indexOf(":")) : "item";
}
