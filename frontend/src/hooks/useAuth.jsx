import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";

const AuthContext = createContext(null);
const buildAuthHeader = (token) => `Bearer ${token}`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Logout method clears state and localStorage
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    delete api.defaults.headers.common.Authorization;
  };

  // Synchronize token state with localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      api.defaults.headers.common.Authorization = buildAuthHeader(token);
    } else {
      localStorage.removeItem("token");
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  // Load user profile on mount if token is present
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data);
        } catch (err) {
          console.error("Failed to load user profile on mount:", err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  // Configure response interceptor to handle session expiry (401)
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // If unauthorized and not on the login route, automatically logout
          if (error.config && error.config.url && !error.config.url.endsWith("/auth/login")) {
            logout();
            localStorage.setItem("auth_error", "Session expired, please log in again.");
            // Force reload to let router redirect to login
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    const { access_token, user: userProfile } = res.data;
    api.defaults.headers.common.Authorization = buildAuthHeader(access_token);
    localStorage.setItem("token", access_token);
    setToken(access_token);
    setUser(userProfile);
    localStorage.removeItem("auth_error");
    return userProfile;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
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
export default AuthContext;
