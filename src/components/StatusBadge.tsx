import type { ReactNode } from "react";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "brand" | "scheduled";

const TONE_CLASS: Record<StatusTone, string> = {
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info-muted text-info",
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-primary/10 text-primary-text",
  scheduled: "bg-chart-4/12 text-chart-4",
};

export function StatusBadge({
  tone,
  children,
  dot = true,
  className,
}: {
  tone: StatusTone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      data-slot="badge"
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASS[tone]} ${className ?? ""}`}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}
