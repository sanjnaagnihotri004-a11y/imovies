
import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/movies", label: "Movies" },
       { to: "/admin/theatres", label: "Theatres" },
  { to: "/admin/shows", label: "Shows" },
    { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/refunds", label: "Refunds" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/reviews", label: "Reviews" },
  // More pages are added here in the next steps
];

export default function AdminLayout() {
  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 56px)", flexWrap: "wrap" }}>
      <aside
        style={{
          width: 200,
          flexShrink: 0,
          background: "#12162a",
          borderRight: "1px solid #2a2f4a",
          padding: 20,
        }}
      >
        <h3 style={{ marginTop: 0, color: "#ff4d6d" }}>Admin</h3>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            style={({ isActive }) => ({
              display: "block",
              padding: "10px 12px",
              marginBottom: 6,
              borderRadius: 6,
              background: isActive ? "#ff4d6d" : "transparent",
              color: "white",
            })}
          >
            {l.label}
          </NavLink>
        ))}
      </aside>

      <main style={{ flex: 1, minWidth: 280, padding: 30 }}>
        <Outlet />
      </main>
    </div>
  );
}