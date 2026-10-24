import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "../types";
import { getMe, loginUser, logoutUser, registerUser, updateProfile as apiUpdateProfile, verifyOtp as apiVerifyOtp, resendOtp as apiResendOtp } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, display_name: string) => Promise<any>;
  verifyOtp: (email: string, code: string, purpose?: string) => Promise<any>;
  resendOtp: (email: string, purpose?: string) => Promise<any>;
  logout: () => Promise<void>;
  updateProfileName: (display_name: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("algotradex_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const storedToken = localStorage.getItem("algotradex_token");
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const u = await getMe();
      setUser(u);
    } catch (err) {
      // Invalid or expired token
      localStorage.removeItem("algotradex_token");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    const res = await loginUser({ email, password });
    if (res.token) {
      localStorage.setItem("algotradex_token", res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (email: string, password: string, display_name: string) => {
    return await registerUser({ email, password, display_name });
  };

  const verifyOtp = async (email: string, code: string, purpose: string = "registration") => {
    const res = await apiVerifyOtp({ email, code, purpose });
    if (res.token) {
      localStorage.setItem("algotradex_token", res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const resendOtp = async (email: string, purpose: string = "registration") => {
    return await apiResendOtp({ email, purpose });
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem("algotradex_token");
      setToken(null);
      setUser(null);
    }
  };

  const updateProfileName = async (display_name: string) => {
    const updated = await apiUpdateProfile({ display_name });
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        updateProfileName,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
