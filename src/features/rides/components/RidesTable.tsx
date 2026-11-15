import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Eye } from "lucide-react";
import type { Ride, RideStatus, RideTab, RideSortKey, RideSortDir } from "@/api/rides";
import { StatusBadge, type StatusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  ARRIVED_RETENTION_MS,
  formatFare,
  formatTime,
  isStalled,
  minutesBetween,
} from "./RidesTable.helpers";
import { rideDate } from "../export";

const STATUS_TONE: Record<RideStatus, StatusTone> = {
  going_to_pick: "warning",
  waiting_for_ride: "info",
  in_transit: "brand",
  arrived: "neutral",
  scheduled: "scheduled",
  completed: "success",
  canceled: "danger",
};

const STATUS_KEY: Record<RideStatus, string> = {
  going_to_pick: "rides.status.goingToPick",
  waiting_for_ride: "rides.status.waitingForRide",
  in_transit: "rides.status.inTransit",
  arrived: "rides.status.arrived",
  scheduled: "rides.status.scheduled",
  completed: "rides.status.completed",
  canceled: "rides.status.canceled",
};

export function StatusPill({ status }: { status: RideStatus }) {
  const { t } = useTranslation();
  return (
    <StatusBadge tone={STATUS_TONE[status]}>{t(STATUS_KEY[status])}</StatusBadge>
  );
}

export type RidesTableTab = RideTab | "all";

function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function tabOfRide(ride: Ride): RideTab {
  if (ride.status === "scheduled") return "upcoming";
  if (ride.status === "completed") return "completed";
  if (ride.status === "canceled") return "canceled";
  return "live";
}

function TwoLine({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="font-medium text-foreground">{top || "—"}</span>
      <span className="font-mono text-[11px] text-muted-foreground">{bottom || "—"}</span>
    </div>
  );
}

interface RowProps {
  ride: Ride;
  tab: RidesTableTab;
  serial?: number;
  actions?: ReactNode;
  stalled: boolean;
  arrivedLeaving: string | null;
  compact: boolean;
  hideRider: boolean;
  viewPathPrefix: string;
}

function DesktopRow({ ride, tab, serial, actions, stalled, arrivedLeaving, compact, hideRider, viewPathPrefix }: RowProps) {
  const { t } = useTranslation();
  const rowTab = tab === "all" ? tabOfRide(ride) : tab;
  const canView = rowTab === "live" || rowTab === "completed";
  const elapsed = tab === "live" ? minutesBetween(ride.startedAt, new Date().toISOString()) : null;
  const dur = tab === "completed" ? minutesBetween(ride.startedAt, ride.completedAt) : null;
  const rowClass =
    "h-14 transition-colors " + (stalled ? "bg-warning-muted" : "hover:bg-muted/50");
  const statusCell = (
    <td className="px-4 py-2">
      <div className="flex items-center gap-2">
        <StatusPill status={ride.status} />
        {stalled && (
          <span className="text-[11px] font-medium text-warning">
            {t("rides.stalled")}
          </span>
        )}
        {arrivedLeaving && (
          <span className="text-[11px] text-muted-foreground">{arrivedLeaving}</span>
        )}
      </div>
    </td>
  );
  const idCell = compact ? (
    <td className="ps-6 pe-4 py-2 font-mono text-xs">
      <Link
        to={`${viewPathPrefix}/${encodeURIComponent(ride.rideId)}`}
        className="font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        {ride.rideId}
      </Link>
    </td>
  ) : (
    <td className="ps-6 pe-4 py-2 font-mono text-xs">{ride.rideId}</td>
  );
  return (
    <tr
      aria-label={
        stalled
          ? t("rides.rowStalledAria", { id: ride.rideId })
          : t("rides.rowAria", { id: ride.rideId })
      }
      className={rowClass}
    >
      {serial !== undefined && (
        <td className="ps-6 pe-2 py-2 text-xs tabular-nums text-muted-foreground">{serial}</td>
      )}
      {idCell}
      {compact && statusCell}
      {!hideRider && <td className="px-4 py-2"><TwoLine top={ride.rider.name} bottom={ride.rider.phone} /></td>}
      {!compact && <td className="px-4 py-2"><TwoLine top={ride.customer.name} bottom={ride.customer.phone} /></td>}
      <td className="px-4 py-2 max-w-[180px] truncate" title={ride.pickup.label}>{ride.pickup.label}</td>
      <td className="px-4 py-2 max-w-[180px] truncate" title={ride.dropoff.label}>{ride.dropoff.label}</td>
      {!compact && statusCell}
      {!compact && <td className="px-4 py-2 whitespace-nowrap">{formatFare(ride.fare)}</td>}
      {tab === "live" && (
        <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
          {elapsed !== null ? t("rides.minutesShort", { n: elapsed }) : "—"}
        </td>
      )}
      {tab === "upcoming" && !compact && (
        <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
          {formatTime(ride.scheduledAt)}
        </td>
      )}
      {tab === "completed" && !compact && (
        <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
          {formatTime(ride.completedAt)}
          {dur !== null && <span className="ms-2">· {t("rides.minutesShort", { n: dur })}</span>}
        </td>
      )}
      {tab === "canceled" && !compact && (
        <td className="px-4 py-2 text-xs text-muted-foreground">
          {ride.canceledBy ? t(`rides.canceledBy.${ride.canceledBy}`) : "—"}
          {ride.cancelReason && <span className="ms-2">· {ride.cancelReason}</span>}
        </td>
      )}
      {tab === "all" && !compact && (
        <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
          {formatDateTime(rideDate(ride))}
        </td>
      )}
      {!compact && (
        <td className="ps-4 pe-6 py-2">
          <div className="flex items-center justify-center gap-1">
            {canView && actions ? (
              <Button asChild type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link
                  to={`${viewPathPrefix}/${encodeURIComponent(ride.rideId)}`}
                  aria-label={t("rides.viewRideAria", { id: ride.rideId })}
                  title={t("rides.viewRide")}
                >
                  <Eye size={14} aria-hidden="true" />
                </Link>
              </Button>
            ) : canView ? (
              <Button asChild type="button" variant="outline" size="sm">
                <Link
                  to={`${viewPathPrefix}/${encodeURIComponent(ride.rideId)}`}
                  aria-label={t("rides.viewRideAria", { id: ride.rideId })}
                >
                  {t("rides.viewRide")}
                </Link>
              </Button>
            ) : (
              !actions && <span aria-hidden="true">—</span>
            )}
            {actions}
          </div>
        </td>
      )}
    </tr>
  );
}

function MobileCard({ ride, tab, serial, actions, stalled, arrivedLeaving, compact, hideRider, viewPathPrefix }: RowProps) {
  const { t } = useTranslation();
  const rowTab = tab === "all" ? tabOfRide(ride) : tab;
  const canView = rowTab === "live" || rowTab === "completed";
  return (
    <div
      className={
        "rounded-xl border p-3.5 flex flex-col gap-2 shadow-card " +
        (stalled
          ? "border-warning/60 border-s-4 bg-warning-muted"
          : "border-border bg-card")
      }
    >
      <div className="flex items-center justify-between gap-2">
        {compact ? (
          <Link
            to={`${viewPathPrefix}/${encodeURIComponent(ride.rideId)}`}
            className="font-mono text-xs font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {ride.rideId}
          </Link>
        ) : (
          <span className="font-mono text-xs">
            {serial !== undefined && <span className="me-2 text-muted-foreground">#{serial}</span>}
            {ride.rideId}
          </span>
        )}
        <StatusPill status={ride.status} />
      </div>
      {!hideRider && (
        <div className="text-sm">
          <span className="text-muted-foreground">{t("rides.columns.rider")}: </span>
          {ride.rider.name} · <span className="font-mono text-xs">{ride.rider.phone}</span>
        </div>
      )}
      {!compact && (
        <div className="text-sm">
          <span className="text-muted-foreground">{t("rides.columns.customer")}: </span>
          {ride.customer.name} · <span className="font-mono text-xs">{ride.customer.phone}</span>
        </div>
      )}
      <div className="text-sm">
        <div><span className="text-muted-foreground">{t("rides.columns.pickup")}: </span>{ride.pickup.label}</div>
        <div><span className="text-muted-foreground">{t("rides.columns.dropoff")}: </span>{ride.dropoff.label}</div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {!compact && <span>{t("rides.columns.fare")}: {formatFare(ride.fare)}</span>}
        {tab === "upcoming" && ride.scheduledAt && !compact && (
          <span>{t("rides.columns.scheduledAt")}: {formatTime(ride.scheduledAt)}</span>
        )}
        {tab === "completed" && ride.completedAt && !compact && (
          <span>{t("rides.columns.completedAt")}: {formatTime(ride.completedAt)}</span>
        )}
        {tab === "canceled" && ride.canceledBy && !compact && (
          <span>{t("rides.columns.canceledBy")}: {t(`rides.canceledBy.${ride.canceledBy}`)}</span>
        )}
        {tab === "all" && !compact && rideDate(ride) && (
          <span>{t("rides.columns.date")}: {formatDateTime(rideDate(ride))}</span>
        )}
        {stalled && <span className="text-warning font-medium">{t("rides.stalled")}</span>}
        {arrivedLeaving && <span>{arrivedLeaving}</span>}
      </div>
      {!compact && (canView || actions) && (
        <div className="flex items-center gap-1 pt-1">
          {canView && (
            <Button asChild type="button" variant="outline" size="sm">
              <Link
                to={`${viewPathPrefix}/${encodeURIComponent(ride.rideId)}`}
                aria-label={t("rides.viewRideAria", { id: ride.rideId })}
              >
                {t("rides.viewRide")}
              </Link>
            </Button>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}

interface SortableThProps {
  sortKey: RideSortKey;
  ariaSort: "ascending" | "descending" | "none";
  onSort: (key: RideSortKey) => void;
  className?: string;
  label: string;
}

function SortableTh({ sortKey, ariaSort, onSort, className, label }: SortableThProps) {
  const indicator = ariaSort === "ascending" ? "↑" : ariaSort === "descending" ? "↓" : "↕";
  return (
    <th scope="col" aria-sort={ariaSort} className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        {label}
        <span aria-hidden="true" className={ariaSort === "none" ? "opacity-40" : "text-foreground"}>
          {indicator}
        </span>
      </button>
    </th>
  );
}

function PlainTh({ className, label }: { className?: string; label: string }) {
  return (
    <th scope="col" className={className}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </th>
  );
}

export interface RidesTableProps {
  rides: Ride[];
  tab: RidesTableTab;
  startIndex?: number;
  renderActions?: (ride: Ride) => ReactNode;
  now: number;
  caption: string;
  sort?: { key: RideSortKey; dir: RideSortDir };
  onSort?: (key: RideSortKey) => void;
  compact?: boolean;
  arrivedFirstSeen?: Map<string, number>;
  hideRiderColumn?: boolean;
  viewPathPrefix?: string;
}

export function RidesTable({
  rides,
  tab,
  now,
  caption,
  sort,
  onSort,
  compact = false,
  arrivedFirstSeen,
  hideRiderColumn = false,
  viewPathPrefix = "/admin/rides",
  startIndex,
  renderActions,
}: RidesTableProps) {
  const { t } = useTranslation();
  const sortable = sort !== undefined && onSort !== undefined;

  const ariaSortFor = (key: RideSortKey): "ascending" | "descending" | "none" => {
    if (!sort || sort.key !== key) return "none";
    return sort.dir === "asc" ? "ascending" : "descending";
  };

  const renderTh = (key: RideSortKey, className: string, label: string) =>
    sortable ? (
      <SortableTh sortKey={key} ariaSort={ariaSortFor(key)} onSort={onSort!} className={className} label={label} />
    ) : (
      <PlainTh className={className} label={label} />
    );

  const decorateRow = (r: Ride) => {
    const stalled = tab === "live" && isStalled(r, now);
    let leaving: string | null = null;
    if (tab === "live" && r.status === "arrived" && arrivedFirstSeen) {
      const first = arrivedFirstSeen.get(r.rideId) ?? now;
      const remaining = Math.max(0, ARRIVED_RETENTION_MS - (now - first));
      const mm = Math.floor(remaining / 60_000);
      const ss = Math.floor((remaining % 60_000) / 1000);
      leaving = t("rides.leavingIn", { time: `${mm}:${String(ss).padStart(2, "0")}` });
    }
    return { stalled, leaving };
  };

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-border bg-muted/50 text-start text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              {startIndex !== undefined && (
                <th scope="col" className="ps-6 pe-2 py-3 w-14">{t("common.serialNo")}</th>
              )}
              {renderTh("rideId", "ps-6 pe-4 py-3 min-w-[110px]", t("rides.columns.rideId"))}
              {compact && renderTh("status", "px-4 py-3 min-w-[130px]", t("rides.columns.status"))}
              {!hideRiderColumn && renderTh("riderName", "px-4 py-3 min-w-[150px]", t("rides.columns.rider"))}
              {!compact && renderTh("customerName", "px-4 py-3 min-w-[150px]", t("rides.columns.customer"))}
              {renderTh("pickupLabel", "px-4 py-3 min-w-[120px]", t("rides.columns.pickup"))}
              {renderTh("dropoffLabel", "px-4 py-3 min-w-[120px]", t("rides.columns.dropoff"))}
              {!compact && renderTh("status", "px-4 py-3 min-w-[130px]", t("rides.columns.status"))}
              {!compact && renderTh("fareAmount", "px-4 py-3 min-w-[100px]", t("rides.columns.fare"))}
              {tab === "live" && renderTh("startedAt", "px-4 py-3 min-w-[90px]", t("rides.columns.elapsed"))}
              {tab === "upcoming" && !compact && renderTh("scheduledAt", "px-4 py-3 min-w-[110px]", t("rides.columns.scheduledAt"))}
              {tab === "completed" && !compact && renderTh("completedAt", "px-4 py-3 min-w-[130px]", t("rides.columns.completedAt"))}
              {tab === "canceled" && !compact && renderTh("canceledBy", "px-4 py-3 min-w-[160px]", t("rides.columns.canceledBy"))}
              {tab === "all" && !compact && <PlainTh className="px-4 py-3 min-w-[130px]" label={t("rides.columns.date")} />}
              {!compact && <th scope="col" className="ps-4 pe-6 py-3 min-w-[110px] text-center">{t("rides.columns.actions")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rides.map((r, i) => {
              const { stalled, leaving } = decorateRow(r);
              return (
                <DesktopRow key={r.rideId} ride={r} tab={tab} serial={startIndex !== undefined ? startIndex + i + 1 : undefined} actions={renderActions?.(r)} stalled={stalled} arrivedLeaving={leaving} compact={compact} hideRider={hideRiderColumn} viewPathPrefix={viewPathPrefix} />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3 p-3 bg-muted/30">
        {rides.map((r, i) => {
          const { stalled, leaving } = decorateRow(r);
          return (
            <MobileCard key={r.rideId} ride={r} tab={tab} serial={startIndex !== undefined ? startIndex + i + 1 : undefined} actions={renderActions?.(r)} stalled={stalled} arrivedLeaving={leaving} compact={compact} hideRider={hideRiderColumn} viewPathPrefix={viewPathPrefix} />
          );
        })}
      </div>
    </>
  );
}
