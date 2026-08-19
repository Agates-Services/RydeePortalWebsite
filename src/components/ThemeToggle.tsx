import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { getTheme, subscribeTheme, toggleTheme } from "@/lib/theme";

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getTheme);
  const isDark = theme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? t("common.themeToggle.toLight") : t("common.themeToggle.toDark")}
      title={isDark ? t("common.themeToggle.toLight") : t("common.themeToggle.toDark")}
      className={className}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
