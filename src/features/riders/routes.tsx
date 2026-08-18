import ActiveRiders from "@/features/riders/ActiveRiders";
import AllRiders from "@/features/riders/AllRiders";
import RiderEditPage from "@/features/riders/pages/RiderEditPage";

export function AllRidersRoute() {
  return <AllRiders />;
}

export function ActiveRidersRoute() {
  return <ActiveRiders />;
}

export function RiderEditRoute() {
  return <RiderEditPage />;
}
