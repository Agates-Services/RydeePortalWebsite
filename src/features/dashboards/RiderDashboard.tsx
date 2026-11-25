import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  DollarSign,
  Calendar,
  Car,
  Star,
  Circle,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { RatingStars } from "@/components/RatingStars";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { RidesTable } from "@/features/rides/components/RidesTable";
import { getRides, type Ride } from "@/api/rides";
import type { Profile } from "@/types/profile";
import { deriveRiderStats, acceptanceRate } from "./riderStats";

interface Props {
  profile: Profile | null;
  userId: string | null;
}

const PKR = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

export default function RiderDashboard({ profile, userId }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getRides({ tab: "completed", scope: "mine", userId: userId ?? undefined, pageSize: 100 });
        if (!cancelled) setRides(data.rides);
      } catch {
        if (!cancelled) setRides([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const [nowMs] = useState(() => Date.now());
  const stats = useMemo(() => deriveRiderStats(rides, nowMs), [rides, nowMs]);

  const totalRides = profile?.totalRides ?? 0;
  const missedRides = profile?.missedRides ?? 0;
  const accRate = acceptanceRate(totalRides, missedRides);
  const rating = profile?.rating ?? 0;
  const online = profile?.online === true;
  const activation = profile?.activationStatus ?? "inactive";

  const lat = Number(profile?.currentLocation?.lat);
  const lon = Number(profile?.currentLocation?.lon);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lon);
  const center: [number, number] = hasLocation ? [lat, lon] : [24.8607, 67.0011];

  const openMyRides = () => navigate("/rider/rides");

  const recent = rides.slice(0, 5);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">
      <PageHeader
        title={t("dashboards.rider.welcome", { name: profile?.name ?? "" })}
        description={t("dashboards.rider.subhead")}
        actions={
          <StatusBadge tone={online ? "success" : "neutral"} className="px-3 py-1">
            {online ? t("dashboards.rider.status.online") : t("dashboards.rider.status.offline")}
          </StatusBadge>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-3">
        <StatCard
          label={t("dashboards.rider.stats.earningsToday")}
          value={PKR.format(stats.earningsToday)}
          hint={t("dashboards.rider.stats.ridesTodayHint", { count: stats.ridesToday })}
          ariaLabel={t("dashboards.rider.stats.earningsTodayAria")}
          onClick={openMyRides}
          icon={<DollarSign />}
          tone="brand"
        />
        <StatCard
          label={t("dashboards.rider.stats.earningsWeek")}
          value={PKR.format(stats.earningsWeek)}
          hint={t("dashboards.rider.stats.earningsWeekHint")}
          ariaLabel={t("dashboards.rider.stats.earningsWeekAria")}
          onClick={openMyRides}
          icon={<Calendar />}
          tone="info"
        />
        <StatCard
          label={t("dashboards.rider.stats.ridesToday")}
          value={stats.ridesToday}
          hint={t("dashboards.rider.stats.ridesLifetimeHint", { count: totalRides })}
          ariaLabel={t("dashboards.rider.stats.ridesTodayAria")}
          onClick={openMyRides}
          icon={<Car />}
          tone="success"
        />
        <StatCard
          label={t("dashboards.rider.stats.rating")}
          value={<RatingStars rating={rating} />}
          hint={t("dashboards.rider.stats.ratingHint")}
          ariaLabel={t("dashboards.rider.stats.ratingAria", { rating: rating.toFixed(1) })}
          icon={<Star />}
          tone="warning"
        />
        <StatCard
          label={t("dashboards.rider.stats.onlineStatus")}
          value={
            <span className="inline-flex items-center gap-2">
              <span className="relative inline-flex h-2.5 w-2.5" aria-hidden="true">
                {online && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-70 animate-ping" />
                )}
                <span
                  className={
                    "relative inline-flex rounded-full h-2.5 w-2.5 " +
                    (online ? "bg-primary" : "bg-muted-foreground")
                  }
                />
              </span>
              <span>{online ? t("dashboards.rider.status.online") : t("dashboards.rider.status.offline")}</span>
            </span>
          }
          hint={
            activation === "active"
              ? t("dashboards.rider.status.active")
              : t("dashboards.rider.status.inactive")
          }
          ariaLabel={t("dashboards.rider.stats.onlineStatusAria", {
            online: online ? t("dashboards.rider.status.online") : t("dashboards.rider.status.offline"),
          })}
          icon={<Circle />}
          tone={online ? "success" : "neutral"}
        />
        <StatCard
          label={t("dashboards.rider.stats.acceptanceRate")}
          value={`${accRate}%`}
          valueClassName={accRate < 85 ? "text-warning" : undefined}
          hint={t("dashboards.rider.stats.missedHint", { count: missedRides })}
          ariaLabel={t("dashboards.rider.stats.acceptanceRateAria", { pct: accRate })}
          icon={<CheckCircle2 />}
          tone={accRate < 85 ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="gap-0 overflow-hidden rounded-xl py-0 xl:col-span-3">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
            <h3 className="text-sm font-semibold text-foreground">{t("dashboards.rider.recentHeading")}</h3>
            <Link
              to="/rider/rides?tab=completed"
              className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("dashboards.activeRidesSection.viewAll")}
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              icon={<Car />}
              title={t("dashboards.rider.recentEmpty")}
              description={t("dashboards.rider.recentEmptyHint")}
            />
          ) : (
            <RidesTable
              rides={recent}
              tab="completed"
              now={nowMs}
              caption={t("dashboards.rider.recentHeading")}
              compact
              hideRiderColumn
              viewPathPrefix="/rider/rides"
            />
          )}
        </Card>

        <Card className="gap-0 overflow-hidden rounded-xl py-0 xl:col-span-2">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 md:px-5">
            <MapPin className="size-4 text-primary-text" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">{t("dashboards.rider.locationHeading")}</h3>
          </div>
          <div dir="ltr" className="isolate h-[280px] w-full xl:h-full xl:min-h-[320px]">
            <MapContainer
              center={center}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {hasLocation && (
                <CircleMarker
                  center={center}
                  radius={10}
                  pathOptions={{
                    fillColor: "#0d8f6e",
                    fillOpacity: 0.9,
                    color: "#ffffff",
                    weight: 2,
                  }}
                >
                  <Popup>{profile?.name}</Popup>
                </CircleMarker>
              )}
            </MapContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
