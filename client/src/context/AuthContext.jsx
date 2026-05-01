import { createContext, useContext, useState, useEffect } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();

  // Initialize auth state from Clerk
  useEffect(() => {
    const initializeAuth = async () => {
      if (!isLoaded) return;

      if (isSignedIn && clerkUser) {
        try {
          const authToken = await getToken();
          setToken(authToken);
          localStorage.setItem("token", authToken);

          // Sync with backend
          const response = await authService.syncClerkUser({
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses[0].emailAddress,
            name: clerkUser.fullName,
            profilePicture: clerkUser.imageUrl
          });

          if (response.success) {
            setUser(response.data);
            localStorage.setItem("user", JSON.stringify(response.data));
          }
        } catch (error) {
          console.error("Error initializing auth:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setLoading(false);
      }
    };

    initializeAuth();
  }, [isLoaded, isSignedIn, clerkUser, getToken]);

  // Login function - stores user and token
  const login = (userData, authToken) => {
    try {
      setUser(userData);
      setToken(authToken);
      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Error during login:", error);
      throw new Error("Failed to save authentication data");
    }
  };

  const { signOut } = useClerkAuth();

  // Logout function - clears all auth data
  const logout = async () => {
    try {
      // Clear local state immediately
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Sign out from Clerk
      await signOut();
      
      // Redirect to landing
      window.location.href = "/";
    } catch (error) {
      console.error("Error during logout:", error);
      // Still redirect as fallback
      window.location.href = "/";
    }
  };

  // Update user data (e.g., after profile update)
  const updateUser = (updatedUserData) => {
    try {
      setUser(updatedUserData);
      localStorage.setItem("user", JSON.stringify(updatedUserData));
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user data");
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  // Get authorization header for API requests
  const getAuthHeader = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated,
    getAuthHeader,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
