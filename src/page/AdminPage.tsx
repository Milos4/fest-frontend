import React, { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../api";
import AdminNavbar from "../component/navBar/AdminNavbar";
import "./admin.css";

interface AdminUser {
  id: number; username: string; email: string; role: "USER" | "ADMIN"; banned: boolean;
  firstName: string; lastName: string; registrationDate: string;
}
interface Report {
  id: number; reporterId: number | null; reporterUsername: string;
  reportedUserId: number | null; reportedUsername: string; postId: number | null;
  postExists: boolean; postContent: string; postMediaUrl: string; type: string;
  message: string; status: string; createdAt: string; reviewedAt: string; reviewedBy: string;
}
interface Page<T> { content: T[]; number: number; totalPages: number; totalElements: number }
type UserForm = Pick<AdminUser, "username" | "email" | "role" | "banned" | "firstName" | "lastName"> & { id?: number; password: string };
const blankForm: UserForm = { username: "", email: "", password: "", role: "USER", banned: false, firstName: "", lastName: "" };
const reportTypes: Record<string, string> = {
  SPAM: "Spam / misleading", ABUSE: "Hate / harassment", INAPPROPRIATE_CONTENT: "Inappropriate content",
  VIOLENCE: "Violence / danger", NUDITY: "Nudity / sexual content", OTHER: "Other",
};
const formatDate = (value: string) => value ? new Date(value).toLocaleString() : "—";

/** Zaseban admin prostor sa navigacijom Users / Reports i provjerenom sesijom. */
export default function AdminPage() {
  const location = useLocation();
  const reportsView = location.pathname === "/admin/reports";
  const currentUser = JSON.parse(localStorage.getItem("userData") || "{}");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<UserForm | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  /** Ucitava jednu stranicu korisnika ili reportova, ukljucujuci prazno stanje. */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (reportsView) {
        const result = await api<Page<Report>>(`/admin/reports?page=${page}&size=20`);
        setReports(result.content); setTotalPages(result.totalPages); setTotal(result.totalElements);
      } else {
        const result = await api<Page<AdminUser>>(`/admin/users?page=${page}&size=20&q=${encodeURIComponent(search)}`);
        setUsers(result.content); setTotalPages(result.totalPages); setTotal(result.totalElements);
        if (page > 0 && !result.content.length) setPage(page - 1);
      }
    } finally { setLoading(false); }
  }, [page, search, reportsView]);

  useEffect(() => { load().catch(e => setError(e.message)); }, [load]);

  /** Jedinstveno obradjuje uspjeh/gresku i sprecava dupli klik na admin akcije. */
  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice(message); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Operation failed"); }
    finally { setBusy(false); }
  }

  /** Ista forma kreira nalog ili mijenja izabrani nalog; prazna lozinka ostaje nepromijenjena. */
  function saveUser(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    run(async () => {
      await api(`/admin/users${form.id ? `/${form.id}` : ""}`, {
        method: form.id ? "PUT" : "POST", body: JSON.stringify(form),
      });
      setForm(null);
    }, form.id ? "User updated." : "User created.");
  }

  /** Otvara edit formu sa najnovijim podacima pojedinacnog korisnika. */
  async function editUser(id: number) {
    setError("");
    try {
      const user = await api<AdminUser>(`/admin/users/${id}`);
      setForm({ ...user, firstName: user.firstName || "", lastName: user.lastName || "", password: "" });
    } catch (e) { setError(e instanceof Error ? e.message : "Cannot load user"); }
  }

  /** Promjena statusa reporta cuva odluku i administratora koji ju je donio. */
  function reviewReport(report: Report, status: string) {
    run(async () => {
      const updated = await api<Report>(`/admin/reports/${report.id}`, { method: "PUT", body: JSON.stringify({ status }) });
      if (selectedReport?.id === report.id) setSelectedReport(updated);
    }, "Report status updated.");
  }

  if (location.pathname !== "/admin/users" && location.pathname !== "/admin/reports") return <Navigate to="/admin/users" replace />;

  return <div className="admin-shell">
    <AdminNavbar username={currentUser.username} onError={setError}
      onUsers={() => { setPage(0); setError(""); setSelectedReport(null); }}
      onReports={() => { setPage(0); setError(""); setForm(null); }} />
    <main className="admin-main">
      <div className="admin-heading"><div><h2>{reportsView ? "Reports" : "Users"}</h2><p>{reportsView ? "Review who reported whom, the content and the reason." : "Create accounts, manage roles and control account access."}</p></div>
        {!reportsView && <button className="admin-primary" onClick={() => { setForm({ ...blankForm }); setError(""); }}>+ Create user</button>}
      </div>
      {error && <div className="admin-alert" role="alert">{error}</div>}
      {notice && <div className="admin-notice" role="status">{notice}</div>}
      {!reportsView && <form className="admin-search" onSubmit={e => { e.preventDefault(); setPage(0); setSearch(query); }}>
        <label htmlFor="admin-search">Search users</label><input id="admin-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Username or email" />
        <button type="submit">Search</button>
      </form>}
      <section className="admin-card" aria-busy={loading}>
        {loading ? <p role="status">Loading…</p> : <>
          <p className="admin-count">{total} {reportsView ? "reports" : "users"}</p>
          <div className="admin-table-scroll">
            {reportsView ? <table><thead><tr><th>Reported by</th><th>Reported user</th><th>Type</th><th>Post</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{reports.map(report => <tr key={report.id}>
                <td>{report.reporterUsername}<small>{report.reporterId ? `ID ${report.reporterId}` : "Deleted account"}</small></td>
                <td>{report.reportedUsername}<small>{report.reportedUserId ? `ID ${report.reportedUserId}` : "Deleted account"}</small></td>
                <td>{reportTypes[report.type] || report.type}</td><td>#{report.postId}{!report.postExists && <small>Removed</small>}</td>
                <td>{formatDate(report.createdAt)}</td><td><span className={`admin-badge ${report.status.toLowerCase()}`}>{report.status}</span></td>
                <td><button disabled={busy} onClick={() => setSelectedReport(report)}>Review</button></td>
              </tr>)}</tbody></table> : <table><thead><tr><th>User</th><th>Email</th><th>Name</th><th>Role</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead>
              <tbody>{users.map(user => <tr key={user.id}>
                <td>{user.username}<small>ID {user.id}</small></td><td>{user.email}</td><td>{user.firstName} {user.lastName}</td><td>{user.role}</td>
                <td><span className={`admin-badge ${user.banned ? "banned" : "active"}`}>{user.banned ? "Banned" : "Active"}</span></td><td>{formatDate(user.registrationDate)}</td>
                <td><div className="admin-actions"><button disabled={busy} onClick={() => editUser(user.id)}>Edit</button>
                  <button disabled={busy || user.id === currentUser.id} onClick={() => run(() => api(`/admin/users/${user.id}/ban`, { method: "PUT", body: JSON.stringify({ banned: !user.banned }) }), user.banned ? "User unbanned." : "User banned.")}>{user.banned ? "Unban" : "Ban"}</button>
                  <button className="admin-danger" disabled={busy || user.id === currentUser.id} onClick={() => {
                    if (window.confirm(`Delete ${user.username} and their posts, events and related account data permanently? Report snapshots will be retained.`)) run(() => api(`/admin/users/${user.id}`, { method: "DELETE" }), "User deleted.");
                  }}>Delete</button></div></td>
              </tr>)}</tbody></table>}
          </div>
          {total === 0 && <p className="admin-empty">{reportsView ? "No reports have been received." : "No users found."}</p>}
          <div className="admin-pagination"><button disabled={page === 0 || busy} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page + 1} of {Math.max(1, totalPages)}</span><button disabled={page + 1 >= totalPages || busy} onClick={() => setPage(p => p + 1)}>Next</button></div>
        </>}
      </section>
      {form && <section className="admin-card admin-editor" aria-label="User editor">
        <h3>{form.id ? `Edit ${form.username}` : "Create user"}</h3>
        <form onSubmit={saveUser}><fieldset disabled={busy}>
          <div className="admin-form-grid">
            <label>Username<input required maxLength={80} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></label>
            <label>Email<input type="email" required maxLength={254} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
            <label>First name<input maxLength={100} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></label>
            <label>Last name<input maxLength={100} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></label>
            <label>{form.id ? "New password (leave blank to keep current)" : "Password"}<input type="password" autoComplete="new-password" required={!form.id} minLength={8} maxLength={72} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
            <label>Role<select disabled={form.id === currentUser.id} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as "USER" | "ADMIN" })}><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></label>
            <label>Status<select disabled={form.id === currentUser.id} value={String(form.banned)} onChange={e => setForm({ ...form, banned: e.target.value === "true" })}><option value="false">Active</option><option value="true">Banned</option></select></label>
          </div><div className="admin-actions"><button className="admin-primary" type="submit">{busy ? "Saving…" : "Save user"}</button><button type="button" onClick={() => setForm(null)}>Cancel</button></div>
        </fieldset></form>
      </section>}
      {selectedReport && <section className="admin-card admin-editor" aria-label="Report details">
        <h3>Report #{selectedReport.id}</h3><p><strong>{selectedReport.reporterUsername}</strong> reported <strong>{selectedReport.reportedUsername}</strong></p>
        <p>{reportTypes[selectedReport.type] || selectedReport.type}: {selectedReport.message}</p>
        <blockquote>{selectedReport.postContent || "No text in this post."}</blockquote>
        {selectedReport.postMediaUrl && /^https?:\/\//i.test(selectedReport.postMediaUrl) && <a href={selectedReport.postMediaUrl} target="_blank" rel="noreferrer">Open reported media</a>}
        <p>Submitted: {formatDate(selectedReport.createdAt)}</p>
        {selectedReport.reviewedBy && <p>Reviewed by {selectedReport.reviewedBy} · {formatDate(selectedReport.reviewedAt)}</p>}
        <div className="admin-actions">
          <button disabled={busy} onClick={() => reviewReport(selectedReport, "RESOLVED")}>Resolve</button>
          <button disabled={busy} onClick={() => reviewReport(selectedReport, "DISMISSED")}>Dismiss</button>
          <button disabled={busy || selectedReport.status === "PENDING"} onClick={() => reviewReport(selectedReport, "PENDING")}>Reopen</button>
          <button className="admin-danger" disabled={busy || !selectedReport.postExists} onClick={() => {
            if (window.confirm("Permanently remove the reported post? The report snapshot will be kept.")) run(async () => {
              await api(`/admin/posts/${selectedReport.postId}`, { method: "DELETE" });
              setSelectedReport({ ...selectedReport, postExists: false });
            }, "Post removed. You can now resolve this report.");
          }}>Remove post</button>
          <button className="admin-danger" disabled={busy || !selectedReport.reportedUserId || selectedReport.reportedUserId === currentUser.id} onClick={() => {
            if (window.confirm(`Ban ${selectedReport.reportedUsername}?`)) run(() => api(`/admin/users/${selectedReport.reportedUserId}/ban`, { method: "PUT", body: JSON.stringify({ banned: true }) }), "Reported user banned.");
          }}>Ban reported user</button>
          <button onClick={() => setSelectedReport(null)}>Close</button>
        </div>
      </section>}
    </main>
  </div>;
}
