import { useEffect } from "react";
import { Link, useRouteError } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ErrorBoundaryPage() {
  const error = useRouteError();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader>
          <CardTitle>{t("errors.boundary.title")}</CardTitle>
          <CardDescription>{t("errors.boundary.message")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t("errors.boundary.reload")}
          </Button>
          <Button asChild>
            <Link to="/">{t("errors.boundary.goHome")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}