const BYTE_UNITS = ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB"];

export function formatBytes(bytes: number, decimals = 2): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : decimals)} ${BYTE_UNITS[exponent]}`;
}

export function formatBytesPerSecond(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatPercent(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return "0 %";
  return `${value.toFixed(decimals)} %`;
}

export function formatUptime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "Offline";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso).getTime();
  if (Number.isNaN(date)) return "—";
  const diffSeconds = Math.round((date - Date.now()) / 1000);
  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
  ];
  const rtf = new Intl.RelativeTimeFormat("de-DE", { numeric: "auto" });
  for (const [unit, secondsInUnit] of divisions) {
    if (Math.abs(diffSeconds) >= secondsInUnit || unit === "second") {
      return rtf.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return "—";
}

export function clampPercent(value: number, max = 100): number {
  return Math.min(Math.max(value, 0), max);
}

export function cpuPercentOfLimit(cpuAbsolute: number, cpuLimit: number): number {
  if (!cpuLimit || cpuLimit <= 0) return 0;
  return clampPercent((cpuAbsolute / cpuLimit) * 100);
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
