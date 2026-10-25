
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const barStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 10,
  padding: "14px 30px",
  background: "#171b30",
  borderBottom: "1px solid #2a2f4a",
};

const linkStyle = { marginLeft: 20 };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav style={barStyle}>
      <Link to="/" style={{ fontSize: 22, fontWeight: "bold", color: "#ff4d6d" }}>
        iMovies
      </Link>
      <div>
        {user ? (
          <>
                        <Link to="/my-bookings" style={linkStyle}>My Bookings</Link>
            <span style={{ marginLeft: 20 }}>Hi, {user.username}</span>
            <button
              onClick={handleLogout}
              style={{
                marginLeft: 20,
                padding: "6px 14px",
                border: "none",
                borderRadius: 6,
                background: "#ff4d6d",
                color: "white",
              }}
            >
              Logout
            </button>
           <Link to="/favorites" style={linkStyle}>Favorites</Link>
                       {user.role === "admin" && (
              <Link to="/admin" style={linkStyle}>Admin</Link>
            )}
          </>
        ) : (
          <>
            <Link to="/login" style={linkStyle}>Login</Link>
            <Link to="/register" style={linkStyle}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}