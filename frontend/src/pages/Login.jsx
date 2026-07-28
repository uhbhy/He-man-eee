import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Heart, Lock, User as UserIcon } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, token, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to home
  useEffect(() => {
    if (!authLoading && token && user) {
      navigate("/");
    }
  }, [authLoading, token, user, navigate]);

  // Read any session expiry error messages
  useEffect(() => {
    const msg = localStorage.getItem("auth_error");
    if (msg) {
      setSessionMessage(msg);
      localStorage.removeItem("auth_error");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSessionMessage("");
    setLoading(true);

    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Unable to connect to the server. Please make sure the backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnterKey = (e) => {
    if (e.key !== "Enter" || loading) {
      return;
    }

    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-rose-100 via-[#FFF9F5] to-amber-100 flex items-center justify-center p-4">
      {/* Decorative Hearts in BG */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Heart className="absolute text-rose-200/40 fill-rose-200/20 top-12 left-10 animate-bounce" size={80} style={{ animationDuration: '6s' }} />
        <Heart className="absolute text-rose-200/30 fill-rose-200/10 bottom-16 right-12 animate-pulse" size={120} style={{ animationDuration: '8s' }} />
        <Heart className="absolute text-amber-200/40 fill-amber-200/20 top-1/2 right-1/4 animate-bounce" size={60} style={{ animationDuration: '4s' }} />
      </div>

      <div className="w-full max-w-md bg-white/70 backdrop-blur-lg border border-white/60 shadow-2xl rounded-3xl p-8 relative z-10 transition-all hover:shadow-rose-100/50">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-br from-romantic-rose to-rose-400 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 mb-4 transform hover:rotate-12 transition-transform">
            <Heart className="text-white fill-white animate-pulse" size={32} />
          </div>
          <h1 className="font-serif text-3xl font-bold text-center text-romantic-gray mb-1">
            Welcome Back
          </h1>
          <p className="text-sm text-romantic-gray/60 text-center">
            Sign in to access your shared romantic space
          </p>
        </div>

        {sessionMessage && (
          <div className="mb-6 bg-amber-50 border-l-4 border-romantic-gold p-4 rounded-r-xl">
            <p className="text-xs text-amber-800 font-medium">{sessionMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-rose-50 border-l-4 border-romantic-rose p-4 rounded-r-xl">
            <p className="text-xs text-romantic-rose font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-romantic-gray/70 mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-romantic-gray/40">
                <UserIcon size={18} />
              </span>
              <input
                type="text"
                name="username"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleEnterKey}
                className="block w-full pl-10 pr-4 py-3 rounded-2xl border border-rose-100 bg-white/90 text-sm placeholder-romantic-gray/40 focus:outline-none focus:ring-2 focus:ring-romantic-rose/20 focus:border-romantic-rose transition-all text-romantic-gray"
                placeholder="Enter your username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-romantic-gray/70 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-romantic-gray/40">
                <Lock size={18} />
              </span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleEnterKey}
                className="block w-full pl-10 pr-4 py-3 rounded-2xl border border-rose-100 bg-white/90 text-sm placeholder-romantic-gray/40 focus:outline-none focus:ring-2 focus:ring-romantic-rose/20 focus:border-romantic-rose transition-all text-romantic-gray"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-romantic-rose to-rose-500 text-white font-medium text-sm rounded-2xl shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <span>Enter Shared App</span>
                <Heart size={16} className="fill-white" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
