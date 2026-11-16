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
import { RydeeLogo } from "@/assets/RydeeLogo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/features/auth/useAuth";
import { roleHome } from "@/types/profile";
import { initialsOf } from "@/lib/initials";
import { useTranslation } from "react-i18next";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  active: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_BUTTON_CLASS =
  "relative h-9 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-white " +
  "data-[active=true]:bg-sidebar-primary/15 data-[active=true]:text-white " +
  "data-[active=true]:[&>svg]:text-sidebar-primary " +
  "data-[active=true]:before:absolute data-[active=true]:before:inset-y-2 data-[active=true]:before:start-0 " +
  "data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary";


export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === "ur";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  const home = roleHome(profile?.role);
  const isRider = home === "/rider";

  const riderGroups: NavGroup[] = [
    {
      label: t("layout.navGroups.overview"),
      items: [
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
      ],
    },
    {
      label: t("layout.navGroups.account"),
      items: [
        {
          label: t("layout.nav.myProfile"),
          to: "/account/profile",
          icon: User,
          active: pathname === "/account/profile",
        },
      ],
    },
  ];

  const staffGroups: NavGroup[] = [
    {
      label: t("layout.navGroups.overview"),
      items: [
        {
          label: t("layout.nav.dashboard"),
          to: home,
          icon: LayoutDashboard,
          active: pathname === home,
        },
      ],
    },
    {
      label: t("layout.navGroups.management"),
      items: [
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
      ],
    },
    {
      label: t("layout.navGroups.operations"),
      items: [
        {
          label: t("layout.nav.liveMap"),
          to: "/admin/active-riders",
          icon: Activity,
          active: pathname === "/admin/active-riders",
        },
      ],
    },
  ];

  const groups = isRider ? riderGroups : staffGroups;

  const name = profile?.name ?? "";
  const initials = initialsOf(name);
  const roleLabel = profile?.role ?? "";

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" variant="inset" side={isUrdu ? "right" : "left"}>
      <SidebarHeader className="border-b border-sidebar-border p-2">
        <Link
          to={home}
          onClick={closeOnMobile}
          className="flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label={t("layout.brand.homeAriaLabel")}
        >
          <RydeeLogo className="-my-2 h-24 w-auto text-white group-data-[collapsible=icon]:hidden" />
          <span
            className="hidden size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground group-data-[collapsible=icon]:flex"
            aria-hidden="true"
          >
            R
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0 px-1">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.to + item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.active}
                      tooltip={item.label}
                      className={NAV_BUTTON_CLASS}
                    >
                      <Link to={item.to} onClick={closeOnMobile}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <SidebarMenuButton
                asChild
                size="lg"
                className="rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-white data-[state=open]:bg-sidebar-accent data-[state=open]:text-white"
              >
                <DropdownMenuTrigger aria-label={name || t("common.accountMenu")}>
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="grid min-w-0 flex-1 text-start leading-tight">
                    <span className="truncate text-sm font-medium text-white">
                      {name || t("common.account")}
                    </span>
                    {roleLabel && (
                      <span className="truncate text-xs text-sidebar-foreground/70">{roleLabel}</span>
                    )}
                  </span>
                  <ChevronsUpDown className="ms-auto size-4 opacity-60" />
                </DropdownMenuTrigger>
              </SidebarMenuButton>
              <DropdownMenuContent
                side={isMobile ? "bottom" : isUrdu ? "left" : "right"}
                align="end"
                sideOffset={8}
                className="min-w-56 rounded-xl"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="grid leading-tight">
                    <span className="truncate text-sm font-medium">{name || t("common.account")}</span>
                    {profile?.phone && (
                      <span className="truncate text-xs text-muted-foreground">{profile.phone}</span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    closeOnMobile();
                    navigate("/account/profile");
                  }}
                >
                  <User />
                  {t("common.myProfile")}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => logout()}>
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
