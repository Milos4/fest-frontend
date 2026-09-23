import React from "react";
import { NavLink } from "react-router-dom";
import { logout } from "../../api";

interface Props {
  username: string;
  onUsers: () => void;
  onReports: () => void;
  onError: (message: string) => void;
}

/** Poseban navbar za admina; korisnicki Navbar.tsx ostaje za obicne naloge. */
export default function AdminNavbar({ username, onUsers, onReports, onError }: Props) {
  return <header className="admin-header">
    <div><span className="admin-eyebrow">ADMINISTRATION</span><h1>Admin panel</h1></div>
    <nav aria-label="Admin navigation">
      <NavLink to="/admin/users" onClick={onUsers}>Users</NavLink>
      <NavLink to="/admin/reports" onClick={onReports}>Reports</NavLink>
    </nav>
    <div className="admin-account"><span>{username}</span>
      <button onClick={() => logout().catch(e => onError(e.message))}>Logout</button>
    </div>
  </header>;
}
