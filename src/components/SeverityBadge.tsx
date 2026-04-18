import type { RiskSeverity } from "@/types/analysis";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

const styles: Record<
  RiskSeverity,
  { bg: string; text: string; ring: string; label: string; Icon: typeof AlertTriangle }
> = {
  high: {
    bg: "bg-risk-high/10",
    text: "text-risk-high",
    ring: "ring-risk-high/30",
    label: "High concern",
    Icon: AlertTriangle,
  },
  medium: {
    bg: "bg-risk-medium/10",
    text: "text-risk-medium",
    ring: "ring-risk-medium/30",
    label: "Watch out",
    Icon: AlertCircle,
  },
  low: {
    bg: "bg-risk-low/10",
    text: "text-risk-low",
    ring: "ring-risk-low/30",
    label: "Note",
    Icon: Info,
  },
};

export const SeverityBadge = ({
  severity,
  size = "md",
}: {
  severity: RiskSeverity;
  size?: "sm" | "md";
}) => {
  const s = styles[severity];
  const Icon = s.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${s.bg} ${s.text} ring-1 ${s.ring} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } font-medium`}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {s.label}
    </span>
  );
};
