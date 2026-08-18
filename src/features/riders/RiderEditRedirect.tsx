import { Navigate, useLocation, useParams } from "react-router";

export function RiderEditRedirect() {
  const { phone } = useParams();
  const location = useLocation();
  return (
    <Navigate
      to={"/admin/users/" + encodeURIComponent(phone ?? "") + "/edit"}
      state={location.state}
      replace
    />
  );
}
