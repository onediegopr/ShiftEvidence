import { formatCompactDateTime } from "./compactDate";

export function formatAdminDate(value: Date | string | null | undefined) {
  return formatCompactDateTime(value);
}
