import { Suspense, lazy, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAllRiders } from "@/api/riders";
import type { ActiveRider } from "@/types/rider";
import { Badge } from "@/components/ui/badge";

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

function mapToActive(r: Record<string, unknown>, idx: number): ActiveRider | null {
  if (toStatus(r) !== "active") return null;
  const coords = toCoords(r);
  if (!coords) return null;
  const id = typeof r.id === "number" ? r.id : idx + 1;
  const name = typeof r.name === "string" ? r.name : "";
  const area = typeof r.area === "string" ? r.area : typeof r.rideArea === "string" ? r.rideArea : "";
  return { id, name, lat: coords.lat, lng: coords.lon, area };
}

export default function ActiveRiders() {
  const { t } = useTranslation();
  const [riders, setRiders] = useState<ActiveRider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAllRiders()
      .then((data) => {
        if (cancelled) return;
        const rows = data.riders ?? [];
        const mapped = rows
          .map((r, i) => mapToActive(r, i))
          .filter((r): r is ActiveRider => r !== null);
        setRiders(mapped);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRiders([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="bg-card border-border text-muted-foreground gap-2 px-4 py-2 text-sm font-medium rounded-full">
          {t("riders.active.total")} <strong className="text-foreground">{riders.length}</strong>
        </Badge>
        <Badge
          className="ms-auto bg-[color:var(--success-muted)] text-[color:var(--success)] border-[color:var(--success)]/25 gap-2 px-3 py-1.5 text-xs font-semibold rounded-full"
          aria-live="polite"
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="motion-reduce:hidden animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[color:var(--success)]" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[color:var(--success)]" />
          </span>
          {t("riders.active.live")}
        </Badge>
      </div>

      <div
        dir="ltr"
        className="flex-1 relative rounded-xl overflow-hidden border border-border isolate"
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
