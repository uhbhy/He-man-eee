import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Moments from "./pages/Moments";
import Wishlist from "./pages/Wishlist";
import Mood from "./pages/Mood";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Home />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Quiz />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/moments"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Moments />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Wishlist />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mood"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Mood />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Fallback Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
