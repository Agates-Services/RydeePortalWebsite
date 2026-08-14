import { beforeAll, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { saveSession } from "@/features/auth/session";
import { AppSidebar } from "@/features/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { deriveRiderStats, acceptanceRate } from "@/features/dashboards/riderStats";
import { getRides, getRide } from "@/api/rides";
import type { Ride } from "@/api/rides";

function mkRide(over: Partial<Ride> & { rideId: string }): Ride {
  return {
    status: "completed",
    rider: { name: "R", phone: "0300111111" },
    customer: { name: "C", phone: "0345" },
    pickup: { label: "A", lat: 0, lng: 0 },
    dropoff: { label: "B", lat: 0, lng: 0 },
    fare: { amount: 0, currency: "PKR" },
    ...over,
  } as Ride;
}

describe("Wave 4 — stat derivation", () => {
  const now = new Date("2026-08-11T12:00:00Z").getTime();
  const todayEarly = new Date("2026-08-11T02:00:00Z").toISOString();
  const yesterday = new Date("2026-08-10T20:00:00Z").toISOString();
  const lastWeek = new Date("2026-08-02T09:00:00Z").toISOString();

  it("sums today's earnings only", () => {
    const rides = [
      mkRide({ rideId: "1", completedAt: todayEarly, fare: { amount: 300, currency: "PKR" } }),
      mkRide({ rideId: "2", completedAt: yesterday, fare: { amount: 500, currency: "PKR" } }),
    ];
    const s = deriveRiderStats(rides, now);
    expect(s.earningsToday).toBe(300);
    expect(s.ridesToday).toBe(1);
  });

  it("this week window sums rides within the ISO week", () => {
    const rides = [
      mkRide({ rideId: "1", completedAt: todayEarly, fare: { amount: 300, currency: "PKR" } }),
      mkRide({ rideId: "2", completedAt: lastWeek, fare: { amount: 900, currency: "PKR" } }),
    ];
    const s = deriveRiderStats(rides, now);
    expect(s.earningsWeek).toBe(300);
  });

  it("skips non-completed and rides without fare", () => {
    const rides = [
      mkRide({ rideId: "1", status: "canceled", completedAt: todayEarly, fare: { amount: 500, currency: "PKR" } }),
      mkRide({ rideId: "2", completedAt: todayEarly, fare: undefined }),
    ];
    const s = deriveRiderStats(rides, now);
    expect(s.earningsToday).toBe(0);
    expect(s.ridesToday).toBe(0);
  });
});

describe("Wave 4 — acceptance rate formula", () => {
  it("100 when no missed", () => expect(acceptanceRate(50, 0)).toBe(100));
  it("100 when no rides at all", () => expect(acceptanceRate(0, 0)).toBe(100));
  it("50 when equal totals + missed", () => expect(acceptanceRate(10, 10)).toBe(50));
  it("~85 rounded", () => expect(acceptanceRate(85, 15)).toBe(85));
  it("<85 warning band", () => expect(acceptanceRate(70, 30)).toBe(70));
});

describe("Wave 4 — My Rides scoping via /get-rides", () => {
  it("scope=mine filters by phone (seed rider owns Live rides)", async () => {
    const data = await getRides({ tab: "live", scope: "mine", phone: "0300111111" });
    for (const r of data.rides) {
      expect(r.rider.phone.replace(/[^0-9]/g, "")).toBe("0300111111");
    }
  });

  it("scope=mine with unknown phone returns empty", async () => {
    const data = await getRides({ tab: "live", scope: "mine", phone: "9999999999" });
    expect(data.rides).toEqual([]);
    expect(data.counts.live).toBe(0);
  });

  it("scope=all (default) returns unscoped rides", async () => {
    const data = await getRides({ tab: "live" });
    expect(data.rides.length).toBeGreaterThan(0);
  });
});


beforeAll(() => {
  if (typeof window !== "undefined" && !window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (q: string) => ({
        matches: false,
        media: q,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
});

function renderSidebar(role: string) {
  saveSession({ role, name: "Test", phone: "0300111111" });
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/rider"]}>
        <AuthProvider>
          <SidebarProvider>
            <AppSidebar />
          </SidebarProvider>
        </AuthProvider>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("Wave 4 — /get-ride scoping (MAJOR-1 fix)", () => {
  it("owner can fetch their own completed ride via scope=mine", async () => {
    const mine = await getRides({ tab: "completed", scope: "mine", phone: "0300111111" });
    expect(mine.rides.length).toBeGreaterThan(0);
    const rideId = mine.rides[0].rideId;
    const view = await getRide({ rideId, scope: "mine", phone: "0300111111" });
    expect(view.ride.rideId).toBe(rideId);
  });

  it("non-owner rider cannot fetch another rider's ride via scope=mine", async () => {
    const mine = await getRides({ tab: "completed", scope: "mine", phone: "0300111111" });
    expect(mine.rides.length).toBeGreaterThan(0);
    const rideId = mine.rides[0].rideId;
    await expect(getRide({ rideId, scope: "mine", phone: "9999999999" })).rejects.toMatchObject({ status: 404 });
  });

  it("scope=all default still resolves any known ride", async () => {
    const all = await getRides({ tab: "completed" });
    expect(all.rides.length).toBeGreaterThan(0);
    const rideId = all.rides[0].rideId;
    const view = await getRide({ rideId });
    expect(view.ride.rideId).toBe(rideId);
  });
});

describe("Wave 4 — sidebar role branch", () => {
  it("Rider sees exactly Dashboard, My rides, My profile", async () => {
    renderSidebar("Rider");
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /my rides/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /my profile/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /all riders/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /^rides$/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /user management/i })).toBeNull();
  });

  it("Admin sees exactly Dashboard, Users, All riders, Rides, Live map in order (Wave 6)", async () => {
    renderSidebar("Admin");
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /all riders/i })).toBeInTheDocument();
    });
    const links = screen.getAllByRole("link").map((a) => a.textContent?.trim() ?? "");
    const navLabels = links.filter((l) => ["Dashboard", "Users", "All riders", "Rides", "Live map"].includes(l));
    expect(navLabels).toEqual(["Dashboard", "Users", "All riders", "Rides", "Live map"]);
    expect(screen.queryByRole("link", { name: /user management/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /my rides/i })).toBeNull();
  });

  it("Operator sees exactly Dashboard, Users, All riders, Rides, Live map in order (Wave 6)", async () => {
    renderSidebar("Operator");
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /all riders/i })).toBeInTheDocument();
    });
    const links = screen.getAllByRole("link").map((a) => a.textContent?.trim() ?? "");
    const navLabels = links.filter((l) => ["Dashboard", "Users", "All riders", "Rides", "Live map"].includes(l));
    expect(navLabels).toEqual(["Dashboard", "Users", "All riders", "Rides", "Live map"]);
    expect(screen.queryByRole("link", { name: /user management/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /my rides/i })).toBeNull();
  });
});
