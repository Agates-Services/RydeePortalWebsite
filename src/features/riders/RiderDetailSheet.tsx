import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { RIDER_STATUS_TONE } from "@/features/riders/constants";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AllRidersRow } from "@/types/rider";
import { formatCnic } from "@/features/riders/cnic";
import { initialsOf } from "@/lib/initials";


function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

interface Field {
  label: string;
  value: string;
  mono?: boolean;
}

export interface RiderDetailSheetProps {
  row: AllRidersRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


export function RiderDetailSheet({ row, open, onOpenChange }: RiderDetailSheetProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isUrdu = i18n.language === "ur";
  const fields: Field[] = row
    ? [
        { label: t("riders.detailSheet.fields.fullName"), value: row.name || "—" },
        { label: t("riders.detailSheet.fields.phone"), value: row.phone || "—", mono: true },
        {
          label: t("riders.detailSheet.fields.cnic"),
          value: row.cnic ? formatCnic(row.cnic) : "—",
          mono: true,
        },
        { label: t("riders.detailSheet.fields.area"), value: row.area || "—" },
        { label: t("riders.detailSheet.fields.joined"), value: formatDate(row.joinedAt) },
        { label: t("riders.detailSheet.fields.dob"), value: formatDate(row.dob) },
        { label: t("riders.detailSheet.fields.pin"), value: row.pin || "—", mono: true },
      ]
    : [];

  const handleEdit = () => {
    if (!row?.phone) return;
    onOpenChange(false);
    navigate(`/admin/users/${encodeURIComponent(row.phone)}/edit`, { state: { row, role: "Rider" } });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isUrdu ? "left" : "right"}
        aria-describedby={undefined}
        className="w-full sm:max-w-md overflow-y-auto data-[state=open]:duration-0 data-[state=closed]:duration-0"
        data-testid="fqa-rider-detail-sheet"
      >
        <SheetHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b border-border pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-accent-foreground"
            >
              {initialsOf(row?.name)}
            </span>
            <SheetTitle className="truncate">{row?.name || t("riders.detailSheet.title")}</SheetTitle>
          </div>
          {row?.phone && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEdit}
              aria-label={t("riders.edit.editRider")}
              title={t("riders.edit.editRider")}
              data-testid="fqa-rider-edit-btn"
              className="me-8"
            >
              <Pencil size={14} aria-hidden="true" />
            </Button>
          )}
        </SheetHeader>

        {row && (
          <div className="px-4 pb-6 space-y-5">
            <div>
              <StatusBadge tone={RIDER_STATUS_TONE[row.status]}>{t(`riders.common.badges.${row.status}`)}</StatusBadge>
            </div>

            <dl className="grid grid-cols-1 divide-y divide-border rounded-xl border border-border text-sm">
              {fields.map((f) => (
                <div key={f.label} className="flex flex-col gap-1 px-4 py-3">
                  <dt
                    className="text-xs font-medium text-muted-foreground"
                    data-fqa-field-label
                  >
                    {f.label}
                  </dt>
                  <dd
                    className={"text-foreground text-sm font-medium " + (f.mono ? "font-mono" : "")}
                    data-fqa-field-value
                  >
                    {f.value}
                  </dd>
                </div>
              ))}
              <div className="flex flex-col gap-1 px-4 py-3">
                <dt
                  className="text-xs font-medium text-muted-foreground"
                  data-fqa-field-label
                >
                  {t("riders.detailSheet.documents")}
                </dt>
                <dd className="text-foreground text-base" data-fqa-field-value>
                  {row.documents && row.documents.length > 0 ? (
                    <ul className="list-disc ps-5 space-y-1">
                      {row.documents.map((d) => (
                        <li key={d} className="text-base">
                          {d}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
