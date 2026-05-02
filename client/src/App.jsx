import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import StandsPage from './pages/StandsPage';
import BookingsPage from './pages/BookingsPage';
import FinancePage from './pages/FinancePage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import PublicBookingPage from './pages/PublicBookingPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/apply" element={<PublicBookingPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="stands" element={<StandsPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
