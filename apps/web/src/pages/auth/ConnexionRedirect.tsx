import { Navigate, useLocation, useSearchParams } from "react-router-dom";

/** Ancienne route /connexion → accueil tuteurs avec modale de connexion. */
export function ConnexionRedirect() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const intent = searchParams.get("intent");
  const next = new URLSearchParams({ auth: "login" });
  if (intent === "teacher") {
    next.set("intent", "teacher");
  }
  return (
    <Navigate
      to={{ pathname: "/", search: `?${next}` }}
      replace
      state={location.state}
    />
  );
}
