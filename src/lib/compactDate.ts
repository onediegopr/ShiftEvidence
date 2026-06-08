type CompactDateOptions = {
  fallback?: string;
  includeTime?: boolean;
};

function formatValue(value: Date | string | null | undefined, options: CompactDateOptions = {}) {
  const fallback = options.fallback ?? "No disponible";
  if (!value) return fallback;

  const date = new Date(value);
  if (date.getTime() === 0 || Number.isNaN(date.getTime())) return fallback;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  if (!options.includeTime) {
    return `${day}/${month}/${year}`;
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatCompactDate(value: Date | string | null | undefined, fallback = "No disponible") {
  return formatValue(value, { fallback, includeTime: false });
}

export function formatCompactDateTime(value: Date | string | null | undefined, fallback = "No disponible") {
  return formatValue(value, { fallback, includeTime: true });
}
