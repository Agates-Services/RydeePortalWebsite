import RidesPage from "@/features/rides/RidesPage";
import RideViewPage from "@/features/rides/RideViewPage";

export function RidesRoute() {
  return <RidesPage />;
}

export function RiderRidesRoute() {
  return <RidesPage scope="mine" />;
}

export function RideViewRoute() {
  return <RideViewPage />;
}

export function RiderRideViewRoute() {
  return <RideViewPage scope="mine" />;
}
