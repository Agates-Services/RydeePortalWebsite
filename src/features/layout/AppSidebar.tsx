import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Activity,
  Car,
  LogOut,
  ChevronsUpDown,
  User,
} from "lucide-react";
import { Logo } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/features/auth/useAuth";
import { roleHome } from "@/types/profile";
import { useTranslation } from "react-i18next";

function initialsOf(name: string | undefined | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === "ur";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { isMobile } = useSidebar();
  const home = roleHome(profile?.role);
  const isRider = home === "/rider";

  const riderItems = [
    {
      label: t("layout.nav.dashboard"),
      to: "/rider",
      icon: LayoutDashboard,
      active: pathname === "/rider",
    },
    {
      label: t("layout.nav.myRides"),
      to: "/rider/rides",
      icon: Car,
      active: pathname.startsWith("/rider/rides"),
    },
    {
      label: t("layout.nav.myProfile"),
      to: "/account/profile",
      icon: User,
      active: pathname === "/account/profile",
    },
  ];

  const staffItems = [
    {
      label: t("layout.nav.dashboard"),
      to: home,
      icon: LayoutDashboard,
      active: pathname === home,
    },
    {
      label: t("layout.nav.users"),
      to: "/admin/users",
      icon: UserCog,
      active: pathname.startsWith("/admin/users"),
    },
    {
      label: t("layout.nav.allRiders"),
      to: "/admin/all-riders",
      icon: Users,
      active: pathname === "/admin/all-riders",
    },
    {
      label: t("layout.nav.rides"),
      to: "/admin/rides",
      icon: Car,
      active: pathname.startsWith("/admin/rides"),
    },
    {
      label: t("layout.nav.liveMap"),
      to: "/admin/active-riders",
      icon: Activity,
      active: pathname === "/admin/active-riders",
    },
  ];

  const items: Array<{ label: string; to: string; icon: typeof LayoutDashboard; active: boolean }> =
    isRider ? riderItems : staffItems;

  const name = profile?.name ?? "";
  const initials = initialsOf(name);

  return (
    <Sidebar collapsible="icon" variant="inset" side={isUrdu ? "right" : "left"}>
      <SidebarHeader className="p-3">
        <Link
          to={home}
          className="flex items-center justify-center group-data-[collapsible=icon]:justify-start"
          aria-label={t("layout.brand.homeAriaLabel")}
        >
          <span className="group-data-[collapsible=icon]:hidden">
            <Logo size="sm" />
          </span>
          <span
            className="hidden group-data-[collapsible=icon]:flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--brand-bright)]/10 text-primary font-bold"
            aria-hidden="true"
          >
            R
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.to + item.label}>
                  <SidebarMenuButton asChild isActive={item.active} tooltip={item.label}>
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <SidebarMenuButton
                asChild
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <DropdownMenuTrigger aria-label={name || t("common.accountMenu")}>
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-[color:var(--brand-bright)]/15 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate font-medium">{name || t("common.account")}</span>
                  <ChevronsUpDown className="ms-auto size-4 opacity-60" />
                </DropdownMenuTrigger>
              </SidebarMenuButton>
              <DropdownMenuContent
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
                className="min-w-56 rounded-lg"
              >
                <DropdownMenuItem onSelect={() => navigate("/account/profile")}>
                  <User />
                  {t("common.myProfile")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => logout()}>
                  <LogOut />
                  {t("common.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
