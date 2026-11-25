import { initialsOf } from "@/lib/initials";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Ban, CircleCheck, FileDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { StatusBadge, type StatusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/useAuth";
import { useDebounced } from "@/features/riders/useDebounced";
import { stringCompare, useTableView } from "@/lib/useTableView";
import { deleteUser, getAllUsers } from "@/api/users";
import { updateUser } from "@/api/riders";
import { EndpointNotAvailableError } from "@/api/client";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { can } from "@/lib/permissions";
import { downloadTablePdf } from "@/lib/pdf";
import { mapUsersResponse } from "./mapper";
import {
  downloadCsv,
  USERS_EXPORT_HEADERS,
  usersCsvFilename,
  usersPdfFilename,
  usersToCsv,
  usersToExportRows,
} from "./csv";
import type { UserRole, UsersRow } from "./types";

type RoleTab = "all" | UserRole;

type SortKey = "name" | "phone" | "email" | "role" | "joinedAt";
type SortDir = "asc" | "desc";
interface SortState {
  key: SortKey;
  dir: SortDir;
}

const DEFAULT_SORT: SortState = { key: "joinedAt", dir: "desc" };
const ROLE_TABS: readonly RoleTab[] = ["all", "Admin", "Operator"];
const SORT_KEYS: readonly SortKey[] = ["name", "phone", "email", "role", "joinedAt"];
const PAGE_SIZES = [10, 25, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];
const DEFAULT_PAGE_SIZE: PageSize = 10;

const ROLE_TONE: Record<UserRole, StatusTone> = {
  Admin: "brand",
  Operator: "info",
};

function formatJoined(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function readRoleTab(sp: URLSearchParams): RoleTab {
  const v = sp.get("role");
  return (ROLE_TABS as readonly string[]).includes(v ?? "") ? (v as RoleTab) : "all";
}

function readSort(sp: URLSearchParams): SortState {
  const key = sp.get("sort");
  const dir = sp.get("dir");
  const validKey = (SORT_KEYS as readonly string[]).includes(key ?? "");
  const validDir = dir === "asc" || dir === "desc";
  if (!validKey || !validDir) return DEFAULT_SORT;
  return { key: key as SortKey, dir: dir as SortDir };
}

function readPageSize(sp: URLSearchParams): PageSize {
  const n = Number(sp.get("pageSize"));
  return (PAGE_SIZES as readonly number[]).includes(n) ? (n as PageSize) : DEFAULT_PAGE_SIZE;
}

function readPage(sp: URLSearchParams): number {
  const n = Number(sp.get("page"));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export default function UsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { profile } = useAuth();
  const callerRole = profile?.role ?? "";
  const canManage = can(callerRole, "manageStaffUsers");
  const [pending, setPending] = useState<{ action: "disable" | "enable" | "delete"; row: UsersRow } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialParams = useRef(searchParams).current;

  const [rows, setRows] = useState<UsersRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [roleTab, setRoleTab] = useState<RoleTab>(() => readRoleTab(initialParams));
  const [searchInput, setSearchInput] = useState(() => initialParams.get("q") ?? "");
  const debouncedSearch = useDebounced(searchInput, 300);
  const [sort, setSort] = useState<SortState>(() => readSort(initialParams));
  const [page, setPage] = useState(() => readPage(initialParams));
  const [pageSize, setPageSize] = useState<PageSize>(() => readPageSize(initialParams));

  useEffect(() => {
    setPage(1);
  }, [roleTab, debouncedSearch, pageSize]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (roleTab !== "all") next.set("role", roleTab);
    const q = debouncedSearch.trim();
    if (q !== "") next.set("q", q);
    if (sort.key !== DEFAULT_SORT.key || sort.dir !== DEFAULT_SORT.dir) {
      next.set("sort", sort.key);
      next.set("dir", sort.dir);
    }
    if (page !== 1) next.set("page", String(page));
    if (pageSize !== DEFAULT_PAGE_SIZE) next.set("pageSize", String(pageSize));
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleTab, debouncedSearch, sort.key, sort.dir, page, pageSize, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    (async () => {
      try {
        const data = await getAllUsers(callerRole);
        if (cancelled) return;
        setRows(mapUsersResponse(data.users));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t("users.errors.loadFailed"));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, callerRole]);

  const total = rows?.length ?? 0;

  const counts = useMemo(() => {
    const c: Record<RoleTab, number> = { all: 0, Admin: 0, Operator: 0 };
    if (!rows) return c;
    c.all = rows.length;
    for (const r of rows) c[r.role]++;
    return c;
  }, [rows]);

  const q = debouncedSearch.trim().toLowerCase();
  const filters = useMemo(
    () => [
      (r: UsersRow) => roleTab === "all" || r.role === roleTab,
      (r: UsersRow) =>
        q === "" ||
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q),
    ],
    [roleTab, q],
  );
  const cmp = useCallback(
    (a: UsersRow, b: UsersRow) => stringCompare(a[sort.key], b[sort.key], sort.dir),
    [sort],
  );
  const { filteredRows, pageRows, pageCount, currentPage, pageStart } = useTableView(
    rows,
    filters,
    cmp,
    page,
    pageSize,
  );

  const toggleSort = useCallback((key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return DEFAULT_SORT;
    });
  }, []);

  const ariaSortFor = (key: SortKey): "ascending" | "descending" | "none" => {
    if (sort.key !== key) return "none";
    return sort.dir === "asc" ? "ascending" : "descending";
  };

  const handleClearFilters = () => {
    setRoleTab("all");
    setSearchInput("");
  };

  const handleExport = () => {
    const csv = usersToCsv(filteredRows);
    downloadCsv(csv, usersCsvFilename(roleTab));
  };

  const handleExportPdf = () => {
    void downloadTablePdf({
      title: "Rydee staff users",
      subtitle: `${filteredRows.length} users · exported ${new Date().toLocaleString("en-GB")}`,
      headers: USERS_EXPORT_HEADERS,
      rows: usersToExportRows(filteredRows),
      filename: usersPdfFilename(roleTab),
      numbered: true,
    });
  };

  const isSelf = (row: UsersRow) =>
    !!profile?.phone && row.phone.replace(/\D/g, "") === profile.phone.replace(/\D/g, "");

  const runPendingAction = async () => {
    if (!pending) return;
    const { action, row } = pending;
    setActionBusy(true);
    setNotice(null);
    try {
      if (action === "delete") {
        if (!row.userId) throw new Error("Missing userId");
        await deleteUser(row.userId);
        setRows((prev) => (prev ? prev.filter((r) => r.id !== row.id) : prev));
        setNotice({ tone: "success", text: t("users.feedback.deleted", { name: row.name }) });
      } else {
        const nextStatus = action === "disable" ? "disabled" : "active";
        await updateUser(row.phone, null, { activationStatus: action === "disable" ? "BLOCKED" : "ACTIVE" });
        setRows((prev) =>
          prev ? prev.map((r) => (r.id === row.id ? { ...r, status: nextStatus } : r)) : prev,
        );
        setNotice({
          tone: "success",
          text: t(action === "disable" ? "users.feedback.disabled" : "users.feedback.enabled", { name: row.name }),
        });
      }
    } catch (err) {
      setNotice({
        tone: "error",
        text:
          err instanceof EndpointNotAvailableError
            ? t("common.needsBackend", { endpoint: err.endpoint })
            : t("users.feedback.failed"),
      });
    } finally {
      setActionBusy(false);
      setPending(null);
    }
  };

  const handleRowKeyDown = (
    e: ReactKeyboardEvent<HTMLTableRowElement>,
    row: UsersRow,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goEdit(row);
    }
  };

  const goEdit = (row: UsersRow) => {
    if (!row.phone) return;
    navigate(`/admin/users/${encodeURIComponent(row.phone)}/edit`, {
      state: { row, role: row.role, backTo: `/admin/users${routerLocation.search}` },
    });
  };

  const loading = rows === null && error === null;
  const empty = rows !== null && filteredRows.length === 0;

  const summaryText =
    filteredRows.length !== total
      ? t("users.summaryFiltered", {
          from: pageStart + 1,
          to: Math.min(pageStart + pageSize, filteredRows.length),
          count: filteredRows.length,
          total,
        })
      : t("users.summary", {
          from: pageStart + 1,
          to: Math.min(pageStart + pageSize, filteredRows.length),
          count: filteredRows.length,
        });

  const roleTabLabel = (tab: RoleTab): string =>
    tab === "all" ? t("users.tabs.all") : t(`users.roles.${tab}`);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div
            role="tablist"
            aria-label={t("users.filterByRole")}
            className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/60 p-1"
          >
            {ROLE_TABS.map((tab) => {
              const selected = roleTab === tab;
              return (
                <button
                  key={tab}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  onClick={() => setRoleTab(tab)}
                  className={
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors " +
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 " +
                    (selected
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {roleTabLabel(tab)}
                  <span
                    className="ms-2 inline-flex min-w-5 items-center justify-center rounded-full bg-background px-1.5 text-xs font-semibold tabular-nums text-muted-foreground"
                    data-testid={`fqa-users-count-${tab}`}
                  >
                    {counts[tab]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative w-full sm:w-64">
            <Label htmlFor="fqa-users-search" className="sr-only">
              {t("users.search")}
            </Label>
            <Search
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70"
              aria-hidden="true"
            />
            <Input
              id="fqa-users-search"
              type="search"
              placeholder={t("users.searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 w-full rounded-lg ps-9 pe-3 text-sm bg-card"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:ms-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredRows.length === 0}
            aria-label={t("users.exportCsvAria", { count: filteredRows.length })}
          >
            {t("users.exportCsv")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={filteredRows.length === 0}
          >
            <FileDown size={14} aria-hidden="true" className="me-1" />
            {t("common.exportPdf")}
          </Button>
          {canManage && (
            <Button
              type="button"
              size="sm"
              onClick={() => navigate("/admin/users/new")}
              aria-label={t("users.addNewAria")}
              data-testid="fqa-users-add-new"
            >
              <Plus size={14} aria-hidden="true" className="me-1" />
              {t("users.addNew")}
            </Button>
          )}
        </div>
      </div>

      {!canManage && (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
          {t("users.readOnlyNotice")}
        </p>
      )}
      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={
            "rounded-lg border px-4 py-2.5 text-sm " +
            (notice.tone === "error"
              ? "border-destructive/25 bg-destructive/10 text-destructive"
              : "border-success/25 bg-success-muted text-success")
          }
        >
          {notice.text}
        </div>
      )}

      <Card className="gap-0 rounded-xl border-border overflow-hidden p-0">
        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="px-6 py-10 text-center text-sm text-muted-foreground"
          >
            {t("users.loading")}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="px-6 py-6 text-sm text-destructive bg-destructive/10 flex items-center justify-between gap-4"
          >
            <span>{error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              {t("users.retry")}
            </Button>
          </div>
        )}

        {!loading && !error && empty && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">{t("users.emptyTitle")}</p>
            <p className="text-xs mt-1 text-muted-foreground">{t("users.emptyHint")}</p>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleClearFilters}
              className="mt-2"
            >
              {t("users.clearFilters")}
            </Button>
          </div>
        )}

        {!loading && !error && !empty && (
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("users.caption")}</caption>
              <thead className="sticky top-0 z-10 bg-muted text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shadow-[inset_0_-1px_0_var(--border)]">
                <tr>
                  <th scope="col" className="ps-6 pe-2 py-3 w-14">
                    {t("common.serialNo")}
                  </th>
                  <SortableTh sortKey="name" ariaSort={ariaSortFor("name")} onSort={toggleSort} minWidth="min-w-[160px]">
                    {t("users.columns.name")}
                  </SortableTh>
                  <SortableTh sortKey="phone" ariaSort={ariaSortFor("phone")} onSort={toggleSort} minWidth="min-w-[130px]">
                    {t("users.columns.phone")}
                  </SortableTh>
                  <SortableTh sortKey="email" ariaSort={ariaSortFor("email")} onSort={toggleSort} minWidth="min-w-[180px]">
                    {t("users.columns.email")}
                  </SortableTh>
                  <SortableTh sortKey="role" ariaSort={ariaSortFor("role")} onSort={toggleSort} minWidth="min-w-[110px]">
                    {t("users.columns.role")}
                  </SortableTh>
                  <th scope="col" className="px-4 py-3 min-w-[100px]">
                    {t("users.columns.status")}
                  </th>
                  <SortableTh sortKey="joinedAt" ariaSort={ariaSortFor("joinedAt")} onSort={toggleSort} minWidth="min-w-[100px]">
                    {t("users.columns.joined")}
                  </SortableTh>
                  <th scope="col" className="ps-4 pe-6 py-3 min-w-[80px] text-center">
                    {t("users.columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageRows.map((r, i) => (
                  <tr
                    key={r.id}
                    tabIndex={canManage ? 0 : undefined}
                    aria-label={canManage ? t("users.rowOpenAria", { name: r.name || "user" }) : undefined}
                    onClick={canManage ? () => goEdit(r) : undefined}
                    onKeyDown={canManage ? (e) => handleRowKeyDown(e, r) : undefined}
                    className={
                      "h-12 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                      (canManage ? "cursor-pointer" : "")
                    }
                  >
                    <td className="ps-6 pe-2 py-3 text-xs tabular-nums text-muted-foreground">{pageStart + i + 1}</td>
                    <th scope="row" className="px-4 py-3 font-medium text-foreground text-start">
                      <span className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground"
                        >
                          {initialsOf(r.name)}
                        </span>
                        <span>{r.name || "—"}</span>
                      </span>
                    </th>
                    <td className="px-4 py-3 font-mono text-xs">{r.phone || "—"}</td>
                    <td className="px-4 py-3">{r.email || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={ROLE_TONE[r.role]}>{t(`users.roles.${r.role}`)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={r.status === "disabled" ? "danger" : "success"}>
                        {t(`users.status.${r.status}`)}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatJoined(r.joinedAt)}</td>
                    <td className="ps-4 pe-6 py-3 text-center">
                      {canManage ? (
                      <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          goEdit(r);
                        }}
                        aria-label={t("users.editUserAria", { name: r.name || "user" })}
                        title={t("users.editUser")}
                        disabled={!r.phone}
                        className="h-8 w-8 p-0"
                        data-testid={`fqa-edit-user-${r.id}`}
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </Button>
                      {!isSelf(r) && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPending({ action: r.status === "disabled" ? "enable" : "disable", row: r });
                            }}
                            aria-label={t(r.status === "disabled" ? "users.actions.enableAria" : "users.actions.disableAria", { name: r.name || "user" })}
                            title={t(r.status === "disabled" ? "users.actions.enable" : "users.actions.disable")}
                            className="h-8 w-8 p-0"
                          >
                            {r.status === "disabled" ? (
                              <CircleCheck size={14} aria-hidden="true" />
                            ) : (
                              <Ban size={14} aria-hidden="true" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPending({ action: "delete", row: r });
                            }}
                            aria-label={t("users.actions.deleteAria", { name: r.name || "user" })}
                            title={t("users.actions.delete")}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </Button>
                        </>
                      )}
                      </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && !empty && (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">{summaryText}</p>
            <div className="sr-only" aria-live="polite">
              {summaryText}
            </div>

            <div className="flex items-center gap-3">
              <Label htmlFor="fqa-users-page-size" className="text-xs text-muted-foreground">
                {t("users.rowsPerPage")}
              </Label>
              <select
                id="fqa-users-page-size"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
                className="h-8 rounded-md border border-input bg-card px-2 text-xs"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  aria-label={t("users.prevPage")}
                >
                  ‹
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  {t("users.page", { cur: currentPage, total: pageCount })}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={currentPage >= pageCount}
                  aria-label={t("users.nextPage")}
                >
                  ›
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !actionBusy) setPending(null);
        }}
        title={pending ? t(`users.confirm.${pending.action}.title`, { name: pending.row.name }) : ""}
        description={pending ? t(`users.confirm.${pending.action}.description`, { name: pending.row.name }) : ""}
        confirmLabel={pending ? t(`users.actions.${pending.action}`) : ""}
        cancelLabel={t("common.cancel")}
        destructive={pending?.action !== "enable"}
        busy={actionBusy}
        onConfirm={runPendingAction}
      />
    </div>
  );
}

interface SortableThProps {
  sortKey: SortKey;
  ariaSort: "ascending" | "descending" | "none";
  onSort: (key: SortKey) => void;
  minWidth: string;
  children: React.ReactNode;
}

function SortableTh({ sortKey, ariaSort, onSort, minWidth, children }: SortableThProps) {
  const indicator = ariaSort === "ascending" ? "↑" : ariaSort === "descending" ? "↓" : "↕";
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`px-4 py-3 ${minWidth}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        {children}
        <span aria-hidden="true" className={ariaSort === "none" ? "opacity-40" : "text-foreground"}>
          {indicator}
        </span>
      </button>
    </th>
  );
}
