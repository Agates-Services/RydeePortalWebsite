import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import {
  Ban,
  Car,
  CheckCircle2,
  Clock,
  Radio,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAllRiders } from "@/api/riders";
import { getAllUsers } from "@/api/users";
import { mapAllRidersResponse } from "@/features/riders/mapper";
import type { AllRidersRow } from "@/types/rider";
import {
  getRides,
  getRidesSummary,
  LIVE_POLL_MS,
  type Ride,
  type RidesSummary,
} from "@/api/rides";
import { RidesTable } from "@/features/rides/components/RidesTable";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/features/auth/useAuth";
import { roleHome } from "@/types/profile";

const RidesCharts = lazy(() =>
  import("./RidesCharts").then((m) => ({
    default: ({ summary }: { summary: RidesSummary }) => (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <m.MonthlyPerformanceChart summary={summary} />
        </div>
        <m.RidesOverviewChart summary={summary} />
      </div>
    ),
  })),
);

const BusyAreasChart = lazy(() =>
  import("./RidesCharts").then((m) => ({ default: m.BusyAreasChart })),
);

interface WireResponse {
  riders?: Array<Record<string, unknown>>;
}

function tsOrNaN(iso: string | undefined): number {
  if (!iso) return Number.NaN;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? Number.NaN : t;
}

function ChartSkeleton({ className }: { className?: string }) {
  return <Card className={`h-[360px] animate-pulse bg-muted/40 ${className ?? ""}`} aria-hidden="true" />;
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const callerRole = profile?.role ?? "";

  const [rows, setRows] = useState<AllRidersRow[] | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [liveRides, setLiveRides] = useState<Ride[] | null>(null);
  const [summary, setSummary] = useState<RidesSummary | null>(null);
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = (await getAllRiders()) as WireResponse;
        if (!data || !Array.isArray(data.riders))
          throw new Error(t("dashboards.errors.invalidResponse"));
        const mapped = mapAllRidersResponse(data.riders);
        if (!cancelled) setRows(mapped);
      } catch (err) {
        console.error(t("dashboards.errors.loadFailed"), err);
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!callerRole) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getAllUsers(callerRole);
        if (!cancelled) setUsersCount(data.users.length);
      } catch {
        if (!cancelled) setUsersCount(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [callerRole]);

  useEffect(() => {
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const data = await getRides({ tab: "live" });
        if (!cancelled) setLiveRides(data.rides);
      } catch {
        if (!cancelled) setLiveRides([]);
      }
    };
    void fetchLive();
    const id = window.setInterval(fetchLive, LIVE_POLL_MS);
    const tickId = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearInterval(tickId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getRidesSummary();
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setSummary(null);
      } finally {
        if (!cancelled) setSummaryLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = rows?.length ?? null;
  const active = rows ? rows.filter((r) => r.status === "active").length : null;
  const pending = rows ? rows.filter((r) => r.status === "pending").length : null;
  const blocked = rows ? rows.filter((r) => r.status === "blocked").length : null;

  const totalRides = summary
    ? summary.completedTotal + summary.canceledTotal + summary.liveTotal + summary.upcomingTotal
    : null;
  const liveCount = liveRides ? liveRides.length : (summary?.liveTotal ?? null);

  const topLive = (liveRides ?? [])
    .slice()
    .sort((a, b) => tsOrNaN(b.startedAt) - tsOrNaN(a.startedAt))
    .slice(0, 10);

  const lang = t("common.localeCode", { defaultValue: "en" });
  const today = new Date(nowTick).toLocaleDateString(lang, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const firstName = (profile?.name ?? "").trim().split(/\s+/)[0] ?? "";
  const isAdmin = roleHome(profile?.role) === "/admin";

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">
      <PageHeader
        title={
          firstName
            ? t("dashboards.admin.greeting", { name: firstName })
            : t("dashboards.admin.greetingNoName")
        }
        description={t("dashboards.admin.subhead", { date: today })}
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-card">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-bright opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-brand-bright" />
            </span>
            {t("dashboards.admin.liveBadge", { seconds: Math.round(LIVE_POLL_MS / 1000) })}
          </span>
        }
      />

      <section className="flex flex-col gap-3" aria-labelledby="dash-rides-heading">
        <div id="dash-rides-heading">
          <SectionTitle
            title={t("dashboards.sections.rides")}
            description={t("dashboards.sections.ridesHint")}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          <StatCard
            label={t("dashboards.stats.totalRides.label")}
            value={totalRides}
            hint={t("dashboards.stats.totalRides.hint")}
            ariaLabel={t("dashboards.stats.totalRides.aria", { count: totalRides ?? "—" })}
            onClick={() => navigate("/admin/rides")}
            icon={<Car />}
            tone="brand"
          />
          <StatCard
            label={t("dashboards.stats.liveRides.label")}
            value={liveCount}
            hint={t("dashboards.stats.liveRides.hint")}
            ariaLabel={t("dashboards.stats.liveRides.aria", { count: liveCount ?? "—" })}
            onClick={() => navigate("/admin/rides?tab=live")}
            icon={<Radio />}
            tone="info"
          />
          <StatCard
            label={t("dashboards.stats.completedRides.label")}
            value={summary?.completedTotal ?? null}
            hint={t("dashboards.stats.completedRides.hint")}
            ariaLabel={t("dashboards.stats.completedRides.aria", {
              count: summary?.completedTotal ?? "—",
            })}
            onClick={() => navigate("/admin/rides?tab=completed")}
            icon={<CheckCircle2 />}
            tone="success"
          />
          <StatCard
            label={t("dashboards.stats.canceledRides.label")}
            value={summary?.canceledTotal ?? null}
            hint={t("dashboards.stats.canceledRides.hint")}
            ariaLabel={t("dashboards.stats.canceledRides.aria", {
              count: summary?.canceledTotal ?? "—",
            })}
            onClick={() => navigate("/admin/rides?tab=canceled")}
            icon={<XCircle />}
            tone="danger"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="dash-people-heading">
        <div id="dash-people-heading">
          <SectionTitle
            title={t("dashboards.sections.people")}
            description={t("dashboards.sections.peopleHint")}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label={t("dashboards.stats.totalRiders.label")}
            value={total}
            hint={t("dashboards.stats.totalRiders.hint")}
            ariaLabel={t("dashboards.stats.totalRiders.aria", { count: total ?? "—" })}
            onClick={() => navigate("/admin/all-riders")}
            icon={<Users />}
            tone="brand"
          />
          <StatCard
            label={t("dashboards.stats.activeRiders.label")}
            value={active}
            hint={t("dashboards.stats.activeRiders.hint")}
            ariaLabel={t("dashboards.stats.activeRiders.aria", { count: active ?? "—" })}
            onClick={() => navigate("/admin/active-riders")}
            icon={<UserCheck />}
            tone="success"
          />
          <StatCard
            label={t("dashboards.stats.pendingRiders.label")}
            value={pending}
            hint={t("dashboards.stats.pendingRiders.hint")}
            ariaLabel={t("dashboards.stats.pendingRiders.aria", { count: pending ?? "—" })}
            onClick={() => navigate("/admin/all-riders?status=pending")}
            icon={<Clock />}
            tone="warning"
          />
          <StatCard
            label={t("dashboards.stats.blockedRiders.label")}
            value={blocked}
            hint={t("dashboards.stats.blockedRiders.hint")}
            ariaLabel={t("dashboards.stats.blockedRiders.aria", { count: blocked ?? "—" })}
            onClick={() => navigate("/admin/all-riders?status=blocked")}
            icon={<Ban />}
            tone="danger"
          />
          <StatCard
            label={t("dashboards.stats.totalUsers.label")}
            value={usersCount}
            hint={t("dashboards.stats.totalUsers.hint")}
            ariaLabel={t("dashboards.stats.totalUsers.aria", { count: usersCount ?? "—" })}
            onClick={() => navigate("/admin/users")}
            icon={isAdmin ? <ShieldCheck /> : <UserCog />}
            tone="neutral"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="dash-perf-heading">
        <div id="dash-perf-heading">
          <SectionTitle
            title={t("dashboards.sections.performance")}
            description={t("dashboards.sections.performanceHint")}
          />
        </div>
        {!summaryLoaded ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartSkeleton className="lg:col-span-2" />
            <ChartSkeleton />
          </div>
        ) : summary ? (
          <Suspense
            fallback={
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <ChartSkeleton className="lg:col-span-2" />
                <ChartSkeleton />
              </div>
            }
          >
            <RidesCharts summary={summary} />
          </Suspense>
        ) : (
          <Card className="rounded-xl">
            <EmptyState
              title={t("dashboards.performanceUnavailable.title")}
              description={t("dashboards.performanceUnavailable.description")}
            />
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="dash-live-heading">
        <Card className="gap-0 overflow-hidden rounded-xl py-0">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
            <div className="min-w-0">
              <h3 id="dash-live-heading" className="text-sm font-semibold text-foreground">
                {t("dashboards.activeRidesSection.heading")}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("dashboards.activeRidesSection.subheading", { shown: topLive.length })}
              </p>
            </div>
            <Link
              to="/admin/rides?tab=live"
              className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("dashboards.activeRidesSection.viewAll")}
            </Link>
          </div>
          {liveRides === null ? (
            <div
              className="px-6 py-10 text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {t("dashboards.activeRidesSection.loading")}
            </div>
          ) : topLive.length === 0 ? (
            <EmptyState
              icon={<Car />}
              title={t("dashboards.activeRidesSection.empty")}
              description={t("dashboards.activeRidesSection.emptyHint")}
            />
          ) : (
            <RidesTable
              rides={topLive}
              tab="live"
              now={nowTick}
              caption={t("dashboards.activeRidesSection.caption")}
              compact
            />
          )}
        </Card>
        {!summaryLoaded ? (
          <ChartSkeleton />
        ) : summary ? (
          <div>
            <Suspense fallback={<ChartSkeleton />}>
              <BusyAreasChart summary={summary} />
            </Suspense>
          </div>
        ) : null}
      </section>
    </div>
  );
}
