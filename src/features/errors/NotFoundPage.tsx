import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/useAuth";
import { roleHome } from "@/types/profile";

export default function NotFoundPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const home = profile ? roleHome(profile.role) : "/login";

  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader>
          <CardTitle>{t("errors.notFound.title")}</CardTitle>
          <CardDescription>{t("errors.notFound.message")}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end">
          <Button asChild>
            <Link to={home}>{t("errors.notFound.goHome")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}