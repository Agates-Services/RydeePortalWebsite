import { Link, Outlet, useLocation } from "react-router";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/features/layout/AppSidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

const TITLE_KEYS: Record<string, string> = {
  "/admin": "layout.title.dashboard",
  "/admin/register": "layout.title.registerUser",
  "/admin/all-riders": "layout.title.allRiders",
  "/admin/active-riders": "layout.title.liveMap",
  "/admin/rides": "layout.title.rides",
  "/admin/users": "layout.title.users",
  "/operator": "layout.title.dashboard",
  "/rider": "layout.title.dashboard",
  "/rider/rides": "layout.title.myRides",
  "/account/profile": "layout.title.myProfile",
  "/notifications": "layout.title.notifications",
  "/admin/riders/new": "layout.title.addRider",
};

function titleKeyFor(pathname: string): string | null {
  if (TITLE_KEYS[pathname]) return TITLE_KEYS[pathname];
  if (pathname.startsWith("/admin/users/") && pathname.endsWith("/edit")) {
    return "layout.title.editUser";
  }
  if (pathname === "/admin/users/new") {
    return "layout.title.registerUser";
  }
  if (pathname.startsWith("/admin/rides/") || pathname.startsWith("/rider/rides/")) {
    return "layout.title.rideView";
  }
  return null;
}

export function DashboardLayout() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const key = titleKeyFor(pathname);
  const title = key ? t(key) : "";
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-x-clip">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:rounded-t-xl md:px-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <h1 className="truncate text-sm font-semibold text-foreground md:text-base">{title}</h1>
          <div className="ms-auto flex items-center gap-1.5">
            <Link
              to="/notifications"
              aria-label={t("notifications.title")}
              title={t("notifications.title")}
              className={`inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                pathname === "/notifications" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              }`}
            >
              <Bell className="size-[18px]" aria-hidden="true" />
            </Link>
            <ThemeToggle className="text-muted-foreground hover:text-foreground" />
            <LanguageSwitcher />
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
