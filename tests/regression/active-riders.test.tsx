import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import ActiveRiders from "@/features/riders/ActiveRiders";
import { API_GET_ALL_RIDERS_URL } from "@/api/riders";
import { server } from "../setup";

vi.mock("@/features/riders/LiveMap", () => ({
  default: ({ riders }: { riders: Array<{ id: number }> }) => (
    <div data-testid="live-map" data-marker-count={riders.length} />
  ),
}));

function wireRider(name: string, phone: string, status: string) {
  return {
    userId: `id-${phone}`,
    profile: {
      name,
      phone,
      role: "rider",
      currentLocation: null,
      activationStatus: status,
    },
  };
}

function locatedWireRider(name: string, phone: string, lat: number, lon: number) {
  return {
    userId: `id-${phone}`,
    profile: {
      name,
      phone,
      role: "rider",
      currentLocation: { lat, lon },
      activationStatus: "ACTIVE",
    },
  };
}

function respondWith(riders: unknown[]) {
  server.use(
    http.post(API_GET_ALL_RIDERS_URL, () =>
      HttpResponse.json({ success: true, riders }),
    ),
  );
}

describe("ActiveRiders location reporting", () => {
  it("counts all active riders even when currentLocation is null", async () => {
    respondWith([
      wireRider("Danial", "03352671943", "PENDING"),
      wireRider("Khalid", "8888888888", "ACTIVE"),
      wireRider("Taha", "9999999999", "ACTIVE"),
    ]);
    render(<ActiveRiders />);

    await waitFor(() => expect(screen.getByTestId("live-map")).toBeInTheDocument());
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByTestId("live-map")).toHaveAttribute("data-marker-count", "0");
    expect(screen.getByText(/0 of 2 reporting location/i)).toBeInTheDocument();
  });

  it("plots the locatable subset and notes the shortfall", async () => {
    respondWith([
      locatedWireRider("Khalid", "8888888888", 24.86, 67.0),
      wireRider("Taha", "9999999999", "ACTIVE"),
    ]);
    render(<ActiveRiders />);

    await waitFor(() => expect(screen.getByTestId("live-map")).toBeInTheDocument());
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByTestId("live-map")).toHaveAttribute("data-marker-count", "1");
    expect(screen.getByText(/1 of 2 reporting location/i)).toBeInTheDocument();
  });

  it("hides the note when every active rider reports location", async () => {
    respondWith([
      locatedWireRider("Khalid", "8888888888", 24.86, 67.0),
      locatedWireRider("Taha", "9999999999", 24.87, 67.01),
    ]);
    render(<ActiveRiders />);

    await waitFor(() => expect(screen.getByTestId("live-map")).toBeInTheDocument());
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByTestId("live-map")).toHaveAttribute("data-marker-count", "2");
    expect(screen.queryByText(/reporting location/i)).not.toBeInTheDocument();
  });
});
