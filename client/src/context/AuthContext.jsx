import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { setAccessToken } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const me = await api.get("/api/auth/me");
    setUser(me.data);
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const refresh = await api.post("/api/auth/refresh");
      setAccessToken(refresh.data.accessToken);
      await fetchMe();
    } catch (error) {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchMe]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (payload) => {
    const response = await api.post("/api/auth/login", payload);
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await api.post("/api/auth/register", payload);
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout");
    setAccessToken(null);
    setUser(null);
  }, []);

  const loginWithFirebase = useCallback(async (idToken) => {
    const response = await api.post("/api/auth/firebase", { idToken });
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, fetchMe, loginWithFirebase }),
    [user, loading, login, register, logout, fetchMe, loginWithFirebase]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
