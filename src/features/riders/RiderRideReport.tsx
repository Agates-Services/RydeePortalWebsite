import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileDown } from "lucide-react";
import { getRides, type Ride, type RideTab } from "@/api/rides";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { downloadCsv, serializeCsv } from "@/lib/csv";
import { downloadTablePdf } from "@/lib/pdf";
import { RidesTable } from "@/features/rides/components/RidesTable";
import { RIDES_EXPORT_HEADERS, rideDate, ridesToExportRows } from "@/features/rides/export";

const TABS: readonly RideTab[] = ["live", "upcoming", "completed", "canceled"];
const REPORT_PAGE_SIZE = 1000;

function isoDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function RiderRideReport({ userId, phone, name }: { userId: string; phone: string; name: string }) {
  const { t } = useTranslation();
  const [rides, setRides] = useState<Ride[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [from, setFrom] = useState(() => isoDay(daysAgo(30)));
  const [to, setTo] = useState(() => isoDay(new Date()));
  const [loadedAt, setLoadedAt] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    setRides(null);
    setFailed(false);
    Promise.all(
      TABS.map((tab) =>
        getRides({
          tab,
          scope: "mine",
          userId,
          phone,
          ...(tab === "completed" || tab === "canceled" ? { page: 1, pageSize: REPORT_PAGE_SIZE } : {}),
        }),
      ),
    )
      .then((parts) => {
        if (cancelled) return;
        setRides(parts.flatMap((p) => p.rides));
        setLoadedAt(Date.now());
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, phone]);

  const rangeInvalid = from !== "" && to !== "" && from > to;

  const inRange = useMemo(() => {
    if (!rides || rangeInvalid) return [];
    const start = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
    const end = to ? new Date(`${to}T23:59:59.999`).getTime() : Infinity;
    return rides
      .filter((r) => {
        const when = rideDate(r);
        if (!when) return false;
        const ms = new Date(when).getTime();
        return ms >= start && ms <= end;
      })
      .sort((a, b) => new Date(rideDate(b) ?? 0).getTime() - new Date(rideDate(a) ?? 0).getTime());
  }, [rides, from, to, rangeInvalid]);

  const completed = inRange.filter((r) => r.status === "completed");
  const canceled = inRange.filter((r) => r.status === "canceled");
  const upcoming = inRange.filter((r) => r.status === "scheduled");
  const ongoing = inRange.length - completed.length - canceled.length - upcoming.length;
  const earnings = completed.reduce((sum, r) => sum + (r.fare?.amount ?? 0), 0);
  const distance = completed.reduce((sum, r) => sum + (r.traveledDistanceKm ?? r.plannedDistanceKm ?? 0), 0);

  const stats: Array<[string, string]> = [
    [t("riders.report.stats.total"), String(inRange.length)],
    [t("riders.report.stats.completed"), String(completed.length)],
    [t("riders.report.stats.canceled"), String(canceled.length)],
    [t("riders.report.stats.ongoing"), String(ongoing)],
    [t("riders.report.stats.upcoming"), String(upcoming.length)],
    [t("riders.report.stats.earnings"), `PKR ${earnings.toLocaleString("en-US")}`],
    [t("riders.report.stats.distance"), `${distance.toFixed(1)} km`],
  ];

  const fileBase = `rydee-rider-${userId.replace(/\D/g, "")}-${from || "start"}-to-${to || "today"}`;

  const exportCsv = () => {
    downloadCsv(serializeCsv(RIDES_EXPORT_HEADERS, ridesToExportRows(inRange)), `${fileBase}.csv`);
  };

  const exportPdf = () => {
    void downloadTablePdf({
      title: `Rider report: ${name || userId}`,
      subtitle: `Phone ${userId} · ${from || "start"} to ${to || "today"}`,
      summary: [
        ["Total rides", String(inRange.length)],
        ["Completed", String(completed.length)],
        ["Canceled", String(canceled.length)],
        ["Ongoing", String(ongoing)],
        ["Upcoming", String(upcoming.length)],
        ["Earnings (completed)", `PKR ${earnings.toLocaleString("en-US")}`],
        ["Distance (completed)", `${distance.toFixed(1)} km`],
      ],
      headers: RIDES_EXPORT_HEADERS,
      rows: ridesToExportRows(inRange),
      filename: `${fileBase}.pdf`,
      numbered: true,
    });
  };

  return (
    <Card className="gap-0 overflow-hidden rounded-xl p-0" data-testid="fqa-rider-report">
      <div className="flex flex-col gap-4 border-b border-border p-4 md:p-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">{t("riders.report.heading")}</h3>
          <p className="text-sm text-muted-foreground">{t("riders.report.description")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fqa-report-from">{t("riders.report.from")}</Label>
            <Input id="fqa-report-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="w-full sm:w-44" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fqa-report-to">{t("riders.report.to")}</Label>
            <Input id="fqa-report-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="w-full sm:w-44" />
          </div>
          <div className="flex gap-2 sm:ms-auto">
            <Button type="button" variant="outline" size="sm" onClick={exportCsv} disabled={inRange.length === 0}>
              {t("common.exportCsv")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={exportPdf} disabled={inRange.length === 0}>
              <FileDown size={14} aria-hidden="true" className="me-1" />
              {t("common.exportPdf")}
            </Button>
          </div>
        </div>
        {rangeInvalid && (
          <p role="alert" className="text-sm text-destructive">
            {t("riders.report.rangeInvalid")}
          </p>
        )}
        {rides !== null && !failed && !rangeInvalid && (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
            {stats.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      {failed ? (
        <EmptyState title={t("riders.report.loadFailed")} />
      ) : rides === null ? (
        <p role="status" className="px-6 py-8 text-sm text-muted-foreground">
          {t("riders.report.loading")}
        </p>
      ) : inRange.length === 0 ? (
        <EmptyState title={t("riders.report.empty")} />
      ) : (
        <div className="max-h-[480px] overflow-y-auto">
          <RidesTable
            rides={inRange}
            tab="all"
            now={loadedAt}
            caption={t("riders.report.heading")}
            hideRiderColumn
            startIndex={0}
          />
        </div>
      )}
    </Card>
  );
}
