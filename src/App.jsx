import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider } from "@/lib/AuthContext";
import Home from "./pages/Home";
import Book from "./pages/Book";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import AppointmentConfirmPage from "./pages/AppointmentConfirmPage";
import AppointmentCancelPage from "./pages/AppointmentCancelPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<Book />} />
            <Route path="/appointment/respond" element={<AppointmentConfirmPage />} />
            <Route path="/appointment/cancel" element={<AppointmentCancelPage />} />
            <Route path="/staff/login" element={<Login portal="staff" />} />
            <Route path="/admin/login" element={<Login portal="admin" />} />
            <Route path="/login" element={<Navigate to="/staff/login" replace />} />
            <Route
              path="/staff"
              element={
                <ProtectedRoute roles={["staff", "admin"]} loginTo="/staff/login">
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["admin"]} loginTo="/admin/login">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
