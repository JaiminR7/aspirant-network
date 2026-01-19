import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ExamProvider, useExam } from "../contexts/ExamContext";
import { Onboarding } from "../pages/Onboarding";
import { Home } from "../pages/Home";

function AppContent() {
  const { isOnboardingComplete } = useExam();

  return (
    <Router>
      <Routes>
        <Route
          path="/onboarding"
          element={
            isOnboardingComplete ? <Navigate to="/" replace /> : <Onboarding />
          }
        />
        <Route
          path="/"
          element={
            isOnboardingComplete ? (
              <Home />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ExamProvider>
      <AppContent />
    </ExamProvider>
  );
}

export default App;
