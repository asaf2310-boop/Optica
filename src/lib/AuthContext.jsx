import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoadingAuth(false));
  }, [refreshUser]);

  const login = async (username, password) => {
    const loggedIn = await base44.auth.login(username, password);
    setUser(loggedIn);
    return loggedIn;
  };

  const logout = async () => {
    await Promise.resolve(base44.auth.logout());
    setUser(null);
  };

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAdmin,
        isStaff,
        isLoadingAuth,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
