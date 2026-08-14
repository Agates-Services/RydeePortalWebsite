import { Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/features/layout/AppSidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <h1 className="text-sm font-medium text-foreground">{title}</h1>
          <LanguageSwitcher className="ms-auto" />
        </header>
        <div className="flex-1">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
