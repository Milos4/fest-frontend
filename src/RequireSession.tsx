import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, ApiError } from "./api";

/** Provjerava serversku sesiju; guest dozvoljava login samo odjavljenim korisnicima. */
export default function RequireSession({ admin = false, guest = false, children }: { admin?: boolean; guest?: boolean; children: React.ReactNode }) {
  const [user, setUser] = useState<any>(undefined);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const location = useLocation();
  const routeKey = `${location.key}:${guest}:${admin}:${attempt}`;
  const [checkedRoute, setCheckedRoute] = useState("");
  useEffect(() => {
    let active = true;
    setUser(undefined);
    setError("");
    setCheckedRoute(routeKey);
    api<any>("/me").then(data => {
      if (active) { localStorage.setItem("userData", JSON.stringify(data)); setUser(data); }
    }).catch(e => {
      if (!active) return;
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        localStorage.removeItem("userData"); setUser(null);
      } else {
        // Serverska greska nije odjava: prikazi poruku i omoguci ponovni pokusaj.
        setError(e.message || "Unable to load account");
      }
    });
    return () => { active = false; };
  }, [routeKey]);
  // Ponovo provjeri sesiju nakon odjave u drugom tabu ili povratka iz browser cachea.
  useEffect(() => {
    const recheck = () => setAttempt(value => value + 1);
    const onStorage = (event: StorageEvent) => {
      if (event.key === "userData" || event.key === null) recheck();
    };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) recheck(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);
  if (checkedRoute !== routeKey) return <p role="status">Loading account...</p>;
  if (error) return <div role="alert" style={{ padding: 32 }}>
    <p>Unable to load your account: {error}</p>
    <button onClick={() => setAttempt(value => value + 1)}>Try again</button>
  </div>;
  if (user === undefined) return <p role="status">Loading account…</p>;
  if (user === null) return guest ? <>{children}</> : <Navigate to="/" replace />;
  const isAdmin = user.role?.name === "ADMIN";
  if (guest) return <Navigate to={isAdmin ? "/admin/users" : "/home"} replace />;
  if (admin && !isAdmin) return <Navigate to="/home" replace />;
  if (!admin && isAdmin) return <Navigate to="/admin/users" replace />;
  return <>{children}</>;
}
