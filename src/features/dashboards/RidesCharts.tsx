import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pie, PieChart, Cell, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown, Minus, MapPin, BarChart3, PieChart as PieIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EmptyState } from "@/components/EmptyState";
import type { RidesSummary } from "@/api/rides";

interface Props {
  summary: RidesSummary;
}

interface PieSlice {
  key: "completed" | "canceled" | "live" | "upcoming";
  name: string;
  value: number;
  fill: string;
}

function ChartCard({
  title,
  description,
  aside,
  children,
  footer,
}: {
  title: string;
  description: string;
  aside?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="h-full gap-0 rounded-xl py-0">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 md:px-5 md:pt-5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {aside}
      </div>
      <div className="flex-1 px-2 py-4 md:px-4">{children}</div>
      {footer && (
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground md:px-5">
          {footer}
        </div>
      )}
    </Card>
  );
}

function useMonthLabel() {
  const { t } = useTranslation();
  const lang = t("common.localeCode", { defaultValue: "en" });
  return (ym: string, style: "short" | "long") => {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(lang, {
      month: style,
      year: style === "long" ? "numeric" : "2-digit",
    });
  };
}

export function MonthlyPerformanceChart({ summary }: Props) {
  const { t } = useTranslation();
  const monthLabel = useMonthLabel();
  const monthly = summary.monthly;

  const config: ChartConfig = {
    completed: { label: t("dashboards.ridesOverview.slices.completed"), color: "var(--chart-completed)" },
    canceled: { label: t("dashboards.ridesOverview.slices.canceled"), color: "var(--chart-canceled)" },
  };

  const data = monthly.map((m) => ({ ...m, label: monthLabel(m.month, "short") }));

  const trend = useMemo(() => {
    if (monthly.length < 2) return { pct: 0, dir: "flat" as const };
    const prev = monthly[monthly.length - 2].completed;
    const curr = monthly[monthly.length - 1].completed;
    if (prev === 0 && curr === 0) return { pct: 0, dir: "flat" as const };
    if (prev === 0) return { pct: 100, dir: "up" as const };
    const pct = ((curr - prev) / prev) * 100;
    return { pct: Math.abs(pct), dir: pct > 0.5 ? ("up" as const) : pct < -0.5 ? ("down" as const) : ("flat" as const) };
  }, [monthly]);

  const trendLabel =
    trend.dir === "up"
      ? t("dashboards.ridesOverview.trendUp", { pct: trend.pct.toFixed(1) })
      : trend.dir === "down"
        ? t("dashboards.ridesOverview.trendDown", { pct: trend.pct.toFixed(1) })
        : t("dashboards.ridesOverview.trendFlat");
  const TrendIcon = trend.dir === "up" ? TrendingUp : trend.dir === "down" ? TrendingDown : Minus;
  const trendClass =
    trend.dir === "up"
      ? "bg-success-muted text-success"
      : trend.dir === "down"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";

  const rangeLabel =
    monthly.length > 0
      ? t("dashboards.ridesOverview.range", {
          from: monthLabel(monthly[0].month, "long"),
          to: monthLabel(monthly[monthly.length - 1].month, "long"),
        })
      : t("dashboards.monthly.subtitle");

  const hasData = monthly.some((m) => m.completed > 0 || m.canceled > 0);

  return (
    <ChartCard
      title={t("dashboards.monthly.title")}
      description={rangeLabel}
      aside={
        hasData ? (
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${trendClass}`}>
            <TrendIcon className="size-3.5" aria-hidden="true" />
            {trendLabel}
          </span>
        ) : undefined
      }
    >
      {!hasData ? (
        <EmptyState icon={<BarChart3 />} title={t("dashboards.monthly.empty")} />
      ) : (
        <>
          <span className="sr-only">
            {monthly
              .map((m) =>
                t("dashboards.monthly.srItem", {
                  month: monthLabel(m.month, "long"),
                  completed: m.completed,
                  canceled: m.canceled,
                }),
              )
              .join(" ")}
          </span>
          <ChartContainer config={config} className="h-[260px] w-full">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }} barGap={4}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                width={32}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={<ChartTooltipContent />} />
              <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
              <Bar dataKey="canceled" fill="var(--color-canceled)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
          <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs">
            {(["completed", "canceled"] as const).map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ background: config[k].color }} />
                <span className="text-muted-foreground">{config[k].label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </ChartCard>
  );
}

export function RidesOverviewChart({ summary }: Props) {
  const { t } = useTranslation();

  const config: ChartConfig = {
    completed: { label: t("dashboards.ridesOverview.slices.completed"), color: "var(--chart-completed)" },
    canceled: { label: t("dashboards.ridesOverview.slices.canceled"), color: "var(--chart-canceled)" },
    live: { label: t("dashboards.ridesOverview.slices.live"), color: "var(--chart-live)" },
    upcoming: { label: t("dashboards.ridesOverview.slices.upcoming"), color: "var(--chart-upcoming)" },
  };

  const slices = useMemo<PieSlice[]>(
    () => [
      { key: "completed", name: config.completed.label, value: summary.completedTotal, fill: "var(--color-completed)" },
      { key: "canceled", name: config.canceled.label, value: summary.canceledTotal, fill: "var(--color-canceled)" },
      { key: "live", name: config.live.label, value: summary.liveTotal, fill: "var(--color-live)" },
      { key: "upcoming", name: config.upcoming.label, value: summary.upcomingTotal, fill: "var(--color-upcoming)" },
    ],
    [summary, config.completed.label, config.canceled.label, config.live.label, config.upcoming.label],
  );

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const nonZero = slices.filter((s) => s.value > 0);

  const srSummary = t("dashboards.ridesOverview.srSummary", {
    completed: summary.completedTotal,
    canceled: summary.canceledTotal,
    live: summary.liveTotal,
    upcoming: summary.upcomingTotal,
  });

  return (
    <ChartCard
      title={t("dashboards.ridesOverview.title")}
      description={t("dashboards.ridesOverview.subtitle")}
      footer={t("dashboards.ridesOverview.caption", { total })}
    >
      <span className="sr-only">{srSummary}</span>
      {total === 0 || nonZero.length === 0 ? (
        <EmptyState icon={<PieIcon />} title={t("dashboards.ridesOverview.empty")} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative mx-auto aspect-square w-full max-w-[200px]">
            <ChartContainer config={config} className="aspect-square w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={nonZero}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="68%"
                  outerRadius="100%"
                  paddingAngle={2}
                  strokeWidth={0}
                  isAnimationActive={false}
                >
                  {nonZero.map((s) => (
                    <Cell key={s.key} fill={s.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tabular-nums text-foreground">{total}</span>
              <span className="text-xs text-muted-foreground">{t("dashboards.ridesOverview.centerLabel")}</span>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 px-2 text-xs">
            {slices.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[3px]" style={{ background: config[s.key].color }} />
                <span className="truncate text-muted-foreground">{s.name}</span>
                <span className="ms-auto font-medium tabular-nums text-foreground">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}

export function BusyAreasChart({ summary }: Props) {
  const { t } = useTranslation();
  const areas = summary.areas.slice(0, 6);
  const max = areas.reduce((m, a) => Math.max(m, a.rides), 0);

  const srSummary =
    areas.length === 0
      ? t("dashboards.busyAreas.empty")
      : areas.map((a) => t("dashboards.busyAreas.srItem", { label: a.label, count: a.rides })).join(", ");

  return (
    <ChartCard
      title={t("dashboards.busyAreas.title")}
      description={t("dashboards.busyAreas.subtitle")}
      footer={areas.length > 0 ? t("dashboards.busyAreas.caption") : undefined}
    >
      <span className="sr-only">{srSummary}</span>
      {areas.length === 0 ? (
        <EmptyState icon={<MapPin />} title={t("dashboards.busyAreas.empty")} />
      ) : (
        <ol className="grid grid-cols-1 gap-x-10 gap-y-3.5 px-2 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {areas.map((a, i) => (
            <li key={a.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="truncate text-foreground">{a.label}</span>
                </span>
                <span className="font-medium tabular-nums text-foreground">{a.rides}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${i === 0 ? "bg-primary" : "bg-chart-2/70"}`}
                  style={{ width: `${max > 0 ? Math.max(4, (a.rides / max) * 100) : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </ChartCard>
  );
}
