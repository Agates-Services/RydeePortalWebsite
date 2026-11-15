import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { roleHome } from "@/types/profile";

export default function NotFoundPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const home = profile ? roleHome(profile.role) : "/login";

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Compass className="size-7" aria-hidden="true" />
        </span>
        <p className="mt-6 font-mono text-sm font-semibold text-primary-text">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t("errors.notFound.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("errors.notFound.message")}</p>
        <Button asChild className="mt-6">
          <Link to={home}>{t("errors.notFound.goHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
