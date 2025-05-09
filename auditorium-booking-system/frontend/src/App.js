import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage'; // ✅ Import RegisterPage
import AdminDashboard from './pages/AdminDashboard';
import AdminBookingRequests from './pages/AdminBookingRequests';
import AdminBookingHistory from './pages/AdminBookingHistory';
import HODDashboard from './pages/HODDashboard';
import HODBookingForm from './pages/HODBookingForm';
import ProtectedRoute from './components/ProtectedRoute';
import HODViewRequests from './pages/HODViewRequests';
import RegisterHOD from './pages/RegisterHOD';
import EditHOD from './pages/EditHOD';
import AdminBooking from './pages/AdminBooking';
import ForgotPassword from './pages/ForgotPassword';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} /> {/* ✅ Admin Register */}

        {/* ========== Admin Routes ========== */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Add other routes here */}
        <Route
          path="/register-hod"
          element={
            <ProtectedRoute role="admin">
              <RegisterHOD />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-hod"
          element={
            <ProtectedRoute role="admin">
              <EditHOD />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-requests"
          element={
            <ProtectedRoute role="admin">
              <AdminBookingRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings/history"
          element={
            <ProtectedRoute role="admin">
              <AdminBookingHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/book"
          element={
            <ProtectedRoute role="admin">
              <AdminBooking />
            </ProtectedRoute>
          }
        />

        {/* ========== HOD Routes ========== */}
        <Route
          path="/hod"
          element={
            <ProtectedRoute role="hod">
              <HODDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/book"
          element={
            <ProtectedRoute role="hod">
              <HODBookingForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/requests"
          element={
            <ProtectedRoute role="hod">
              <HODViewRequests />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
