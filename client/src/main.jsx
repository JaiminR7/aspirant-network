import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ExamProvider } from "./context/ExamContext";
import { ToastProvider } from "./components/ui/toast";
import AppRouter from "./router/AppRouter";

import { ThemeProvider } from "./context/ThemeContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ExamProvider>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </ExamProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
