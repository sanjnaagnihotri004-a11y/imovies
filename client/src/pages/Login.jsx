
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export const formBox = {
  maxWidth: 400,
  margin: "50px auto",
  padding: 30,
  background: "#171b30",
  borderRadius: 10,
};

export const inputStyle = {
  width: "100%",
  padding: 10,
  marginBottom: 14,
  borderRadius: 6,
  border: "1px solid #2a2f4a",
  background: "#0f1220",
  color: "#f1f1f1",
};

export const buttonStyle = {
  width: "100%",
  padding: 12,
  border: "none",
  borderRadius: 6,
  background: "#ff4d6d",
  color: "white",
  fontSize: 16,
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the page from reloading
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Logged in");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={formBox}>
      <h2 style={{ marginTop: 0 }}>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          style={inputStyle}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={inputStyle}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button style={buttonStyle} disabled={loading}>
          {loading ? "Please wait..." : "Login"}
        </button>
      </form>
      <p>
        New here? <Link to="/register" style={{ color: "#ff4d6d" }}>Create an account</Link>
      </p>
    </div>
  );
}