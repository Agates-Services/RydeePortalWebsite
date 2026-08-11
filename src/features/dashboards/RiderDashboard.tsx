import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  DollarSign,
  Calendar,
  Car,
  Star,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { RatingStars } from "@/components/RatingStars";
import { getRides, type Ride } from "@/api/rides";
import type { Profile } from "@/types/profile";
import { deriveRiderStats, acceptanceRate } from "./riderStats";

interface Props {
  profile: Profile | null;
}

const PKR = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

export default function RiderDashboard({ profile }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);

  const phone = profile?.phone ?? "";

  useEffect(() => {
    if (!phone) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getRides({ tab: "completed", scope: "mine", phone, pageSize: 100 });
        if (!cancelled) setRides(data.rides);
      } catch {
        if (!cancelled) setRides([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phone]);

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

  return (
    <main className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t("dashboards.rider.welcome", { name: profile?.name ?? "" })}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("dashboards.rider.subhead")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label={t("dashboards.rider.stats.earningsToday")}
          value={PKR.format(stats.earningsToday)}
          valueClassName="text-primary"
          hint={t("dashboards.rider.stats.ridesTodayHint", { count: stats.ridesToday })}
          ariaLabel={t("dashboards.rider.stats.earningsTodayAria")}
          onClick={openMyRides}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          label={t("dashboards.rider.stats.earningsWeek")}
          value={PKR.format(stats.earningsWeek)}
          hint={t("dashboards.rider.stats.earningsWeekHint")}
          ariaLabel={t("dashboards.rider.stats.earningsWeekAria")}
          onClick={openMyRides}
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          label={t("dashboards.rider.stats.ridesToday")}
          value={stats.ridesToday}
          hint={t("dashboards.rider.stats.ridesLifetimeHint", { count: totalRides })}
          ariaLabel={t("dashboards.rider.stats.ridesTodayAria")}
          onClick={openMyRides}
          icon={<Car className="h-4 w-4" />}
        />
        <StatCard
          label={t("dashboards.rider.stats.rating")}
          value={
            <span className="inline-flex items-center gap-2">
              <span className="tabular-nums">{rating.toFixed(1)}</span>
              <RatingStars rating={rating} />
            </span>
          }
          hint={t("dashboards.rider.stats.ratingHint")}
          ariaLabel={t("dashboards.rider.stats.ratingAria", { rating: rating.toFixed(1) })}
          icon={<Star className="h-4 w-4" />}
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
          icon={<Circle className="h-4 w-4" />}
        />
        <StatCard
          label={t("dashboards.rider.stats.acceptanceRate")}
          value={`${accRate}%`}
          valueClassName={accRate < 85 ? "text-warning" : undefined}
          hint={t("dashboards.rider.stats.missedHint", { count: missedRides })}
          ariaLabel={t("dashboards.rider.stats.acceptanceRateAria", { pct: accRate })}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,40%)] gap-4">
        <Card className="rounded-xl p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {t("dashboards.rider.locationHeading")}
          </h3>
          <div
            dir="ltr"
            className="w-full h-[240px] lg:h-[420px] rounded-lg overflow-hidden border border-border isolate"
          >
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
                    fillColor: "#15803d",
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
    </main>
  );
}
