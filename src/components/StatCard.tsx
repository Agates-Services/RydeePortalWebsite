import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  hint: string;
  ariaLabel: string;
  onClick?: () => void;
  icon: ReactNode;
}

export function StatCard({
  label,
  value,
  valueClassName,
  hint,
  ariaLabel,
  onClick,
  icon,
}: StatCardProps) {
  const display: ReactNode = value == null || value === "" ? "—" : value;
  const interactive = onClick !== undefined && value != null && value !== "—" && value !== "";
  const cardClasses =
    "rounded-xl gap-0 py-4 text-start w-full transition-shadow " +
    "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const content = (
    <>
      <CardHeader>
        <CardDescription className="text-xs">{label}</CardDescription>
        <CardTitle
          className={`text-2xl font-semibold tabular-nums @[250px]/card-header:text-3xl ${valueClassName ?? ""}`}
        >
          {display}
        </CardTitle>
        <CardAction className="text-muted-foreground">{icon}</CardAction>
      </CardHeader>
      <CardFooter className="pt-3 text-xs text-muted-foreground">{hint}</CardFooter>
    </>
  );
  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={
          "bg-card text-card-foreground flex flex-col gap-0 rounded-xl border py-4 text-start w-full transition-shadow " +
          "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        }
      >
        {content}
      </button>
    );
  }
  return <Card className={cardClasses}>{content}</Card>;
}
