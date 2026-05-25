import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

function portalForRole(role) {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/";
}

export default function ProtectedRoute({ children, roles, loginTo = "/staff/login" }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginTo} replace />;
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to={portalForRole(user.role)} replace />;
  }

  return children;
}
