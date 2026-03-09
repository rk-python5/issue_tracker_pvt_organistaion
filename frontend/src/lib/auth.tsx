import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { loginApi, type LoginResponse } from "./api";

export type Role = "employee" | "supervisor" | "admin";

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeUser(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return {
      id: payload.id,
      username: payload.username,
      displayName: payload.displayName,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = localStorage.getItem("token");
    return t ? decodeUser(t) : null;
  });

  // Validate token on mount
  useEffect(() => {
    if (token) {
      const decoded = decodeUser(token);
      if (!decoded) {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      }
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res: LoginResponse = await loginApi(username, password);
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser({
      id: res.user.id,
      username: res.user.username,
      displayName: res.user.displayName,
      role: res.user.role as Role,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
