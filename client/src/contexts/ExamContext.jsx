import React, { createContext, useContext, useState, useEffect } from "react";

const ExamContext = createContext();

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error("useExam must be used within an ExamProvider");
  }
  return context;
};

export const ExamProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("aspirant-user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsOnboardingComplete(true);
    }
  }, []);

  // Save user data to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("aspirant-user", JSON.stringify(user));
    }
  }, [user]);

  const completeOnboarding = (userData) => {
    setUser(userData);
    setIsOnboardingComplete(true);
  };

  const switchExam = (newExam) => {
    setUser((prev) => ({
      ...prev,
      primaryExam: newExam,
    }));
  };

  const updateUser = (updates) => {
    setUser((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const logout = () => {
    setUser(null);
    setIsOnboardingComplete(false);
    localStorage.removeItem("aspirant-user");
  };

  const value = {
    user,
    isOnboardingComplete,
    completeOnboarding,
    switchExam,
    updateUser,
    logout,
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};
