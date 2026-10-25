
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MovieDetails from "./pages/MovieDetails";
import SeatSelect from "./pages/SeatSelect";
import BookingConfirmed from "./pages/BookingConfirmed";
import MyBookings from "./pages/MyBookings";
import Favorites from "./pages/Favorites";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMovies from "./pages/AdminMovies";
import AdminTheatres from "./pages/AdminTheatres";
import AdminShows from "./pages/AdminShows";
import AdminBookings from "./pages/AdminBookings";
import AdminRefunds from "./pages/AdminRefunds";
import AdminUsers from "./pages/AdminUsers";
import AdminReviews from "./pages/AdminReviews";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route
  path="/show/:id/seats"
  element={
    <ProtectedRoute>
      <SeatSelect />
    </ProtectedRoute>
  }

/>
    <Route
  path="/booking-confirmed"
  element={
    <ProtectedRoute>
      <BookingConfirmed />
    </ProtectedRoute>
  }
/>
<Route
  path="/my-bookings"
  element={
    <ProtectedRoute>
      <MyBookings />
    </ProtectedRoute>
  }
/>
<Route
  path="/favorites"
  element={
    <ProtectedRoute>
      <Favorites />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin"
  element={
    <ProtectedRoute adminOnly>
      <AdminLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<AdminDashboard />} />
  <Route path="movies" element={<AdminMovies />} />
    <Route path="theatres" element={<AdminTheatres />} />
  <Route path="shows" element={<AdminShows />} />
    <Route path="bookings" element={<AdminBookings />} />
  <Route path="refunds" element={<AdminRefunds />} />
  <Route path="users" element={<AdminUsers />} />
  <Route path="reviews" element={<AdminReviews />} />
</Route>
      </Routes>
      <ToastContainer position="top-right" theme="dark" />
    </>
  );
}

export default App;