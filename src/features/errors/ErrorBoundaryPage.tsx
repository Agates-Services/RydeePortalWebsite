import { useEffect } from "react";
import { Link, useRouteError } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

export default function ErrorBoundaryPage() {
  const error = useRouteError();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <TriangleAlert className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">{t("errors.boundary.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("errors.boundary.message")}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t("errors.boundary.reload")}
          </Button>
          <Button asChild>
            <Link to="/">{t("errors.boundary.goHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
