export type ReportTone = "neutral" | "good" | "warning" | "danger" | "info";

export const PRINT_REPORT_THEME = {
  ink: "#101828",
  muted: "#526173",
  faint: "#8a97a8",
  line: "#d8e1ec",
  paper: "#ffffff",
  panel: "#f6f8fb",
  panelStrong: "#edf6fb",
  tableHeader: "#eaf2f8",
  cyan: "#0891b2",
  blue: "#2563eb",
  green: "#047857",
  amber: "#b45309",
  red: "#b91c1c",
  slate: "#334155",
  purple: "#5b4b8a",
} as const;

export const PRINT_TONE_COLORS: Record<ReportTone, { fill: string; stroke: string; text: string }> = {
  neutral: { fill: "#f1f5f9", stroke: "#cbd5e1", text: PRINT_REPORT_THEME.slate },
  good: { fill: "#e9f8f1", stroke: "#a7f3d0", text: PRINT_REPORT_THEME.green },
  warning: { fill: "#fff4df", stroke: "#fde68a", text: PRINT_REPORT_THEME.amber },
  danger: { fill: "#fff0f0", stroke: "#fecaca", text: PRINT_REPORT_THEME.red },
  info: { fill: "#e7f8fb", stroke: "#a5f3fc", text: PRINT_REPORT_THEME.cyan },
};
