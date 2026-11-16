import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Activity, BarChart3, ShieldCheck } from "lucide-react";
import { RydeeLogo } from "@/assets/RydeeLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const features = [
    { icon: Activity, label: t("auth.shell.features.live") },
    { icon: ShieldCheck, label: t("auth.shell.features.riders") },
    { icon: BarChart3, label: t("auth.shell.features.insights") },
  ];
  return (
    <div className="flex min-h-svh w-full bg-background">
      <aside className="relative hidden w-[44%] max-w-[640px] shrink-0 flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex xl:p-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-32 -top-32 size-[420px] rounded-full bg-sidebar-primary/10 blur-3xl"
        />
        <RydeeLogo className="relative -ms-6 -mt-6 h-32 w-auto self-start text-white" />
        <div className="relative flex flex-col gap-6">
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
            {t("auth.shell.panelTitle")}
          </h2>
          <p className="max-w-md text-base text-sidebar-foreground">{t("auth.shell.panelSubtitle")}</p>
          <ul className="flex flex-col gap-3">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex size-8 items-center justify-center rounded-lg bg-white/[0.06] text-sidebar-primary ring-1 ring-white/10">
                  <f.icon className="size-4" aria-hidden="true" />
                </span>
                {f.label}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-sidebar-foreground/70">{t("auth.shell.tagline")}</p>
      </aside>

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-end gap-2 p-4">
          <ThemeToggle className="text-muted-foreground hover:text-foreground" />
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12">
          <div className="flex w-full max-w-[440px] flex-col items-center">
            {children}
            <p className="mt-8 text-center text-xs text-muted-foreground lg:hidden">
              {t("auth.shell.tagline")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
