import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Landing from "../pages/Landing";
import ForgotPassword from "../pages/ForgotPassword";
import AppLayout from "../layouts/AppLayout";
import { SignedIn, SignedOut, RedirectToSignIn, useAuth as useClerkAuth } from "@clerk/clerk-react";
import SignInPage from "../pages/auth/SignInPage";
import SignUpPage from "../pages/auth/SignUpPage";
import Onboarding from "../pages/Onboarding";

// Protected Route wrapper - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const { isLoaded, isSignedIn } = useClerkAuth();
  
  if (loading || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Profile...</p>
        </div>
      </div>
    );
  }

  // STRICT CHECK: Must be signed in to Clerk AND have a valid MongoDB user
  if (!isSignedIn || !user) {
    return <RedirectToSignIn />;
  }

  return (
    <>
      {user && !user.onboarded && window.location.pathname !== "/onboarding" ? (
        <Navigate to="/onboarding" replace />
      ) : (
        children
      )}
    </>
  );
};

// Public Route wrapper - redirects to home if already authenticated
const PublicRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    if (user && !user.onboarded) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return children;
};

const AppRouter = () => {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user, loading: authLoading } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page - Accessible to everyone, but redirects if logged in */}
        <Route
          path="/"
          element={
            isLoaded && isSignedIn ? (
              user && !user.onboarded ? (
                <Navigate to="/onboarding" replace />
              ) : (
                <Navigate to="/home" replace />
              )
            ) : (
              <Landing />
            )
          }
        />

        {/* Public Routes - redirect to /home if authenticated */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        {/* Protected Routes - redirect to / if not authenticated */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
