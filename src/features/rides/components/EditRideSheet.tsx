import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Ride } from "@/api/rides";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export interface EditRideValues {
  pickupLabel: string;
  dropoffLabel: string;
  fareAmount: number | undefined;
}

export function EditRideSheet({
  ride,
  busy,
  onSave,
  onClose,
}: {
  ride: Ride | null;
  busy: boolean;
  onSave: (values: EditRideValues) => void;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [fare, setFare] = useState("");

  useEffect(() => {
    setPickup(ride?.pickup.label ?? "");
    setDropoff(ride?.dropoff.label ?? "");
    setFare(ride?.fare ? String(ride.fare.amount) : "");
  }, [ride]);

  const fareNumber = fare.trim() === "" ? undefined : Number(fare);
  const fareInvalid = fareNumber !== undefined && (!Number.isFinite(fareNumber) || fareNumber < 0);
  const canSave = !busy && pickup.trim() !== "" && dropoff.trim() !== "" && !fareInvalid;

  return (
    <Sheet open={ride !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={i18n.language === "ur" ? "left" : "right"}
        aria-describedby={undefined}
        className="w-full sm:max-w-md"
      >
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>{t("rides.edit.title", { id: ride?.rideId ?? "" })}</SheetTitle>
        </SheetHeader>
        <form
          className="flex flex-col gap-4 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSave) onSave({ pickupLabel: pickup.trim(), dropoffLabel: dropoff.trim(), fareAmount: fareNumber });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fqa-edit-ride-pickup">{t("rides.columns.pickup")}</Label>
            <Input id="fqa-edit-ride-pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fqa-edit-ride-dropoff">{t("rides.columns.dropoff")}</Label>
            <Input id="fqa-edit-ride-dropoff" value={dropoff} onChange={(e) => setDropoff(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fqa-edit-ride-fare">{t("rides.edit.fare", { currency: ride?.fare?.currency ?? "PKR" })}</Label>
            <Input
              id="fqa-edit-ride-fare"
              inputMode="decimal"
              value={fare}
              onChange={(e) => setFare(e.target.value)}
              aria-invalid={fareInvalid || undefined}
            />
            {fareInvalid && <p className="text-xs text-destructive">{t("rides.edit.fareInvalid")}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!canSave}>
              {t("rides.edit.save")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
