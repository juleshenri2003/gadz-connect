import { Navigate, useLocation } from "react-router-dom";

export function AdminMembersRedirect() {
  const location = useLocation();
  return (
    <Navigate
      to={`/admin/utilisateurs${location.search}${location.hash}`}
      replace
    />
  );
}
