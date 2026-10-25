

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";
import Pager from "../components/Pager";
import { cell, fieldStyle } from "../adminStyles";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Wait until the admin stops typing
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/users", { params: { search: debounced || undefined, page } })
      .then((res) => {
        setUsers(res.data.users);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      })
      .catch(() => toast.error("Could not load users"))
      .finally(() => setLoading(false));
  }, [debounced, page]);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Users</h1>

      <input
        style={{ ...fieldStyle, minWidth: 260 }}
        placeholder="Search by username or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <span style={{ marginLeft: 14, opacity: 0.7 }}>{total} user(s)</span>

      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 600 }}>
            <thead>
              <tr>
                <th style={cell}>Username</th>
                <th style={cell}>Email</th>
                <th style={cell}>Phone</th>
                <th style={cell}>Role</th>
                <th style={cell}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td style={cell}>{u.username}</td>
                  <td style={cell}>{u.email}</td>
                  <td style={cell}>{u.phone || "-"}</td>
                  <td style={cell}>{u.role}</td>
                  <td style={cell}>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}