
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { formBox, inputStyle, buttonStyle } from "./Login";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={formBox}>
      <h2 style={{ marginTop: 0 }}>Create account</h2>
      <form onSubmit={handleSubmit}>
        <input style={inputStyle} name="username" placeholder="Username (3-20 characters)"
          value={form.username} onChange={handleChange} required />
        <input style={inputStyle} name="email" type="email" placeholder="Email"
          value={form.email} onChange={handleChange} required />
        <input style={inputStyle} name="phone" placeholder="Phone (optional)"
          value={form.phone} onChange={handleChange} />
        <input style={inputStyle} name="password" type="password"
          placeholder="Password (at least 8 characters)"
          value={form.password} onChange={handleChange} required />
        <button style={buttonStyle} disabled={loading}>
          {loading ? "Please wait..." : "Register"}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login" style={{ color: "#ff4d6d" }}>Login</Link>
      </p>
    </div>
  );
}