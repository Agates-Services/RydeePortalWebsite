import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { getNotifications, type PortalNotification } from "@/api/notifications";

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<PortalNotification[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getNotifications()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const lang = t("common.localeCode", { defaultValue: "en" });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader title={t("notifications.title")} description={t("notifications.description")} />
      <Card className="gap-0 overflow-hidden rounded-xl py-0">
        {failed ? (
          <EmptyState icon={<Bell />} title={t("notifications.error")} />
        ) : items === null ? (
          <p className="px-6 py-10 text-sm text-muted-foreground" role="status">
            {t("notifications.loading")}
          </p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Bell />}
            title={t("notifications.emptyTitle")}
            description={t("notifications.emptyDescription")}
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li key={n.id} className="flex gap-3 px-4 py-4 md:px-5">
                <span
                  aria-hidden="true"
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-primary"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString(lang)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
