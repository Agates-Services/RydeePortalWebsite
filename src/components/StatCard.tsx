import type { ReactNode } from "react";

export type StatCardTone = "brand" | "success" | "warning" | "danger" | "info" | "neutral";

const ICON_TONE: Record<StatCardTone, string> = {
  brand: "bg-primary/10 text-primary-text",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info-muted text-info",
  neutral: "bg-muted text-muted-foreground",
};

export interface StatCardProps {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  hint: string;
  ariaLabel: string;
  onClick?: () => void;
  icon: ReactNode;
  tone?: StatCardTone;
}

export function StatCard({
  label,
  value,
  valueClassName,
  hint,
  ariaLabel,
  onClick,
  icon,
  tone = "brand",
}: StatCardProps) {
  const isEmpty = value == null || value === "";
  const display: ReactNode = isEmpty ? "—" : value;
  const interactive = onClick !== undefined && !isEmpty && value !== "—";
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-[18px] ${ICON_TONE[tone]}`}
        >
          {icon}
        </span>
      </div>
      <div
        className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums text-foreground md:text-[28px] ${
          isEmpty ? "text-muted-foreground" : ""
        } ${valueClassName ?? ""}`}
      >
        {display}
      </div>
      <div className="mt-2 truncate text-xs text-muted-foreground group-hover:text-primary-text">
        {hint}
      </div>
    </>
  );
  const base =
    "group flex w-full flex-col rounded-xl border border-border bg-card p-3.5 text-start text-card-foreground shadow-card sm:p-4 md:p-5";
  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={
          base +
          " transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-card-hover " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        }
      >
        {content}
      </button>
    );
  }
  return (
    <div data-slot="card" className={base}>
      {content}
    </div>
  );
}
