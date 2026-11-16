import { Suspense, lazy, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAllRiders } from "@/api/riders";
import type { ActiveRider } from "@/types/rider";
import { Users } from "lucide-react";

const LiveMap = lazy(() => import("./LiveMap"));

function toStatus(r: Record<string, unknown>): string {
  const s = r.activationStatus ?? r.activation_status;
  return typeof s === "string" ? s.toLowerCase() : "";
}

function toCoords(r: Record<string, unknown>): { lat: number; lon: number } | null {
  const loc = r.currentLocation;
  if (!loc || typeof loc !== "object") return null;
  const { lat, lon } = loc as { lat?: unknown; lon?: unknown };
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  return { lat, lon };
}

function toLocatable(r: Record<string, unknown>, idx: number): ActiveRider | null {
  const coords = toCoords(r);
  if (!coords) return null;
  const id = typeof r.id === "number" ? r.id : idx + 1;
  const name = typeof r.name === "string" ? r.name : "";
  const area = typeof r.area === "string" ? r.area : typeof r.rideArea === "string" ? r.rideArea : "";
  return { id, name, lat: coords.lat, lng: coords.lon, area };
}

export default function ActiveRiders() {
  const { t } = useTranslation();
  const [activeCount, setActiveCount] = useState(0);
  const [riders, setRiders] = useState<ActiveRider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAllRiders()
      .then((data) => {
        if (cancelled) return;
        const rows = data.riders ?? [];
        const active = rows.filter((r) => toStatus(r) === "active");
        const locatable = active
          .map((r, i) => toLocatable(r, i))
          .filter((r): r is ActiveRider => r !== null);
        setActiveCount(active.length);
        setRiders(locatable);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setActiveCount(0);
        setRiders([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-card">
        <span className="flex size-9 items-center justify-center rounded-lg bg-success-muted text-success">
          <Users className="size-[18px]" aria-hidden="true" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-xs text-muted-foreground">{t("riders.active.total")}</span>
          <strong className="text-xl font-semibold tabular-nums text-foreground">{activeCount}</strong>
        </div>
        {!loading && riders.length < activeCount ? (
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {t("riders.active.reporting", { located: riders.length, total: activeCount })}
          </span>
        ) : null}
        <span
          className="ms-auto inline-flex items-center gap-2 rounded-full bg-success-muted px-3 py-1.5 text-xs font-semibold text-success"
          aria-live="polite"
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="motion-reduce:hidden animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-success" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          {t("riders.active.live")}
        </span>
      </div>

      <div
        dir="ltr"
        className="flex-1 relative rounded-xl overflow-hidden border border-border shadow-card isolate"
        style={{ minHeight: 0 }}
      >
        {loading ? (
          <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height: "100%", minHeight: "calc(100vh - 200px)" }}
          >
            {t("riders.active.loading")}
          </div>
        ) : (
          <Suspense
            fallback={
              <div
                className="flex items-center justify-center text-sm text-muted-foreground"
                style={{ height: "100%", minHeight: "calc(100vh - 200px)" }}
              >
                {t("riders.active.loading")}
              </div>
            }
          >
            <LiveMap riders={riders} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
