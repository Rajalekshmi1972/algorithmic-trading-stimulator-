import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// App Pages
import Dashboard from "./pages/Dashboard";
import Backtesting from "./pages/Backtesting";
import Results from "./pages/Results";
import ResultDetail from "./pages/ResultDetail";
import Strategies from "./pages/Strategies";
import Comparison from "./pages/Comparison";
import Trades from "./pages/Trades";
import Watchlist from "./pages/Watchlist";
import Market from "./pages/Market";
import Profile from "./pages/Profile";
import { Settings, About } from "./pages/Static";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Application Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/backtesting" element={<Backtesting />} />
              <Route path="/results" element={<Results />} />
              <Route path="/results/:id" element={<ResultDetail />} />
              <Route path="/strategies" element={<Strategies />} />
              <Route path="/comparison" element={<Comparison />} />
              <Route path="/trades" element={<Trades />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/market" element={<Market />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
