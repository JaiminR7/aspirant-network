import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const ExamContext = createContext(null);

export const ExamProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [currentExam, setCurrentExam] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize exam from user's primaryExam
  useEffect(() => {
    if (!authLoading) {
      if (user && user.primaryExam) {
        // Check localStorage for exam preference (if user has secondary exam)
        const storedExam = localStorage.getItem("currentExam");

        if (
          storedExam &&
          user.secondaryExam &&
          storedExam === user.secondaryExam
        ) {
          // User has switched to secondary exam
          setCurrentExam(user.secondaryExam);
        } else {
          // Default to primary exam
          setCurrentExam(user.primaryExam);
          localStorage.setItem("currentExam", user.primaryExam);
        }
      } else {
        setCurrentExam(null);
      }
      setLoading(false);
    }
  }, [user, authLoading]);

  // Switch exam (only allowed if user has secondary exam)
  const switchExam = (exam) => {
    if (!user) {
      throw new Error("User must be authenticated to switch exams");
    }

    // Validate the requested exam
    if (exam !== user.primaryExam && exam !== user.secondaryExam) {
      throw new Error(
        "Invalid exam selection. Must be primary or secondary exam."
      );
    }

    // Check if secondary exam exists
    if (exam === user.secondaryExam && !user.secondaryExam) {
      throw new Error("User does not have a secondary exam configured");
    }

    setCurrentExam(exam);
    localStorage.setItem("currentExam", exam);
  };

  // Get available exams for the user
  const getAvailableExams = () => {
    if (!user) return [];

    const exams = [user.primaryExam];
    if (user.secondaryExam) {
      exams.push(user.secondaryExam);
    }
    return exams;
  };

  // Check if user can switch exams
  const canSwitchExam = () => {
    return user && !!user.secondaryExam;
  };

  // Check if exam is currently active
  const isActiveExam = (exam) => {
    return currentExam === exam;
  };

  const value = {
    currentExam,
    loading,
    switchExam,
    getAvailableExams,
    canSwitchExam,
    isActiveExam,
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};

// Custom hook to use exam context
export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error("useExam must be used within an ExamProvider");
  }
  return context;
};

export default ExamContext;
