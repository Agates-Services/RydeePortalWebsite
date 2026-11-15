import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { getRide, type Ride, type RideStatus, type RidesScope } from "@/api/rides";
import { useAuth } from "@/features/auth/useAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusPill } from "@/features/rides/components/RidesTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, User, MapPin, Banknote, Clock, Timer, Route, Hourglass, CheckCircle2 } from "lucide-react";

const RideMap = lazy(() => import("./RideMap"));

const LIVE_STATUSES: RideStatus[] = ["going_to_pick", "waiting_for_ride", "in_transit", "arrived"];
const POLL_MS = 12000;
const STALE_MS = 3 * 60 * 1000;

function isLive(status: RideStatus): boolean {
  return LIVE_STATUSES.includes(status);
}

interface RideViewPageProps {
  scope?: RidesScope;
}

export default function RideViewPage({ scope = "all" }: RideViewPageProps = {}) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const myPhone = scope === "mine" ? (profile?.phone ?? "") : "";
  const { rideId } = useParams<{ rideId: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!rideId) {
      setNotFound(true);
      return;
    }
    (async () => {
      try {
        const data = await getRide({ rideId, scope, phone: myPhone });
        if (cancelled) return;
        setRide(data.ride);
      } catch (err) {
        if (cancelled) return;
        const status = (err as { status?: number } | null)?.status;
        if (status === 404) {
          setNotFound(true);
        } else if (status === 0 || status === undefined) {
          setUnavailable(true);
        } else {
          setError(err instanceof Error ? err.message : t("rides.errors.loadFailed"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rideId, t, scope, myPhone]);

  const liveMode = ride ? isLive(ride.status) : false;
  useEffect(() => {
    if (!rideId || !liveMode) return;
    pollRef.current = setInterval(async () => {
      try {
        const data = await getRide({ rideId, scope, phone: myPhone });
        setRide(data.ride);
      } catch {
        // ignore transient poll errors; next tick retries
      }
    }, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [rideId, liveMode, scope, myPhone]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!liveMode) return;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [liveMode]);

  const backLink = (
    <Button
      asChild
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      aria-label={t("rides.viewRidePage.back")}
    >
      <Link to={scope === "mine" ? "/rider/rides" : "/admin/rides"}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      </Link>
    </Button>
  );

  if (notFound) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-2">{backLink}</div>
        <Card className="px-6 py-12 text-center rounded-xl">
          <p className="text-sm font-medium text-foreground">
            {t("rides.viewRidePage.notFoundTitle")}
          </p>
          <p className="text-xs mt-1 text-muted-foreground">
            {t("rides.viewRidePage.notFoundHint")}
          </p>
        </Card>
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-2">{backLink}</div>
        <Card className="px-6 py-12 text-center rounded-xl">
          <p className="text-sm font-medium text-foreground">{t("rides.unavailableTitle")}</p>
          <p className="text-xs mt-1 text-muted-foreground">{t("rides.unavailableHint")}</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-2">{backLink}</div>
        <div role="alert" className="text-sm text-destructive bg-destructive/10 rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-2">{backLink}</div>
        <div role="status" className="text-sm text-muted-foreground">
          {t("rides.loading")}
        </div>
      </div>
    );
  }

  const fareText = ride.fare
    ? `${ride.fare.currency} ${ride.fare.amount.toLocaleString()}`
    : "\u2014";

  const formatMinutes = (n: number) => t("rides.viewRidePage.minutesValue", { count: n });
  const formatKm = (n: number) => t("rides.viewRidePage.kmValue", { km: n.toFixed(1) });
  const formatClock = (ms: number) => {
    const d = new Date(ms);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };
  const completedDurationMin =
    ride.status === "completed" && ride.startedAt && ride.completedAt
      ? Math.max(
          0,
          Math.round(
            (new Date(ride.completedAt).getTime() - new Date(ride.startedAt).getTime()) / 60000,
          ),
        )
      : null;
  const completedAtClock = ride.completedAt ? formatClock(new Date(ride.completedAt).getTime()) : null;
  const estCompletionClock =
    liveMode && ride.eta ? formatClock(now + ride.eta.minutes * 60000) : null;

  const stalled =
    liveMode &&
    ride.riderLocation &&
    now - new Date(ride.riderLocation.updatedAt).getTime() > STALE_MS;

  const freshnessSec = ride.riderLocation
    ? Math.max(0, Math.floor((now - new Date(ride.riderLocation.updatedAt).getTime()) / 1000))
    : null;
  const freshnessText =
    freshnessSec === null
      ? null
      : freshnessSec < 60
        ? t("rides.markers.updatedAgo", {
            value: freshnessSec,
            unit: t("rides.markers.units.sec"),
          })
        : t("rides.markers.updatedAgo", {
            value: Math.floor(freshnessSec / 60),
            unit: t("rides.markers.units.min"),
          });

  return (
    <div className="flex min-h-[calc(100svh-5rem)] flex-col gap-4 p-4 md:h-[calc(100svh-5rem)] md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {backLink}
        <h2 className="font-mono text-lg font-semibold tracking-tight">{ride.rideId}</h2>
        <StatusPill status={ride.status} />
        {stalled && <StatusBadge tone="warning">{t("rides.viewRidePage.stalled")}</StatusBadge>}
      </div>

      <div className="flex flex-1 flex-col md:flex-row gap-4 min-h-0">
        <Card className="gap-0 rounded-xl p-0 md:w-[360px] md:shrink-0 md:self-start md:max-h-full md:overflow-y-auto">
          <h3 className="border-b border-border px-4 py-3 text-sm font-semibold md:px-5">{t("rides.viewRidePage.detailsTitle")}</h3>
          <dl className="grid grid-cols-1 divide-y divide-border px-4 md:px-5">
            <div className="flex flex-col gap-1 py-3">
              <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                {t("rides.columns.rider")}
              </dt>
              <dd className="font-medium text-sm">
                {ride.rider.name}
                <span className="ms-2 font-mono text-xs text-muted-foreground">
                  {ride.rider.phone}
                </span>
              </dd>
            </div>
            <div className="flex flex-col gap-1 py-3">
              <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                {t("rides.columns.customer")}
              </dt>
              <dd className="font-medium text-sm">
                {ride.customer.name}
                <a
                  href={`tel:${ride.customer.phone}`}
                  className="ms-2 font-mono text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  {ride.customer.phone}
                </a>
              </dd>
            </div>
            <div className="flex flex-col gap-1 py-3">
              <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {t("rides.columns.pickup")}
              </dt>
              <dd className="text-sm">{ride.pickup.label}</dd>
            </div>
            <div className="flex flex-col gap-1 py-3">
              <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {t("rides.columns.dropoff")}
              </dt>
              <dd className="text-sm">{ride.dropoff.label}</dd>
            </div>
            <div className="flex flex-col gap-1 py-3">
              <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
                {t("rides.columns.fare")}
              </dt>
              <dd className="text-sm">{fareText}</dd>
            </div>
            {ride.status === "completed" && completedDurationMin !== null && completedAtClock && (
              <div className="flex flex-col gap-1 py-3">
                <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("rides.viewRidePage.completion")}
                </dt>
                <dd className="text-sm">
                  {completedAtClock} · {formatMinutes(completedDurationMin)}
                </dd>
              </div>
            )}
            {ride.status === "completed" && ride.traveledDistanceKm !== undefined && (
              <div className="flex flex-col gap-1 py-3">
                <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Route className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("rides.viewRidePage.distanceTraveled")}
                </dt>
                <dd className="text-sm">{formatKm(ride.traveledDistanceKm)}</dd>
              </div>
            )}
            {liveMode && ride.plannedDistanceKm !== undefined && (
              <div className="flex flex-col gap-1 py-3">
                <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Route className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("rides.viewRidePage.plannedDistance")}
                </dt>
                <dd className="text-sm">{formatKm(ride.plannedDistanceKm)}</dd>
              </div>
            )}
            {(ride.status === "completed" || liveMode) && ride.waitingMinutes !== undefined && (
              <div className="flex flex-col gap-1 py-3">
                <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("rides.viewRidePage.waitingTime")}
                </dt>
                <dd className="text-sm">{formatMinutes(ride.waitingMinutes)}</dd>
              </div>
            )}
            {estCompletionClock && (
              <div className="flex flex-col gap-1 py-3">
                <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("rides.viewRidePage.estCompletion")}
                </dt>
                <dd className="text-sm">{estCompletionClock}</dd>
              </div>
            )}
            {liveMode && freshnessText && (
              <div className="flex flex-col gap-1 py-3">
                <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("rides.viewRidePage.lastUpdate")}
                </dt>
                <dd className="text-sm">{freshnessText}</dd>
              </div>
            )}
          </dl>
        </Card>

        <div
          role="img"
          aria-label={t("rides.viewRidePage.mapAria", { id: ride.rideId })}
          className="flex-1 min-h-[320px] overflow-hidden rounded-xl border border-border shadow-card md:min-h-0"
        >
          <Suspense
            fallback={
              <div className="h-full bg-muted/30 flex items-center justify-center min-h-[320px] text-sm text-muted-foreground">
                {t("rides.loading")}
              </div>
            }
          >
            <RideMap ride={ride} height="100%" now={now} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
