import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ExamProvider } from "./context/ExamContext";
import { ToastProvider } from "./components/ui/toast";
import AppRouter from "./router/AppRouter";

import { ThemeProvider } from "./context/ThemeContext";
import { ClerkProvider } from "@clerk/clerk-react";

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ThemeProvider>
        <AuthProvider>
          <ExamProvider>
            <ToastProvider>
              <AppRouter />
            </ToastProvider>
          </ExamProvider>
        </AuthProvider>
      </ThemeProvider>
    </ClerkProvider>
  </StrictMode>,
);
