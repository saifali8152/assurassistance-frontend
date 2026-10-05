// src/main.tsx
import "./i18n";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

// ErrorBoundary wraps everything on purpose: without it, any render error
// unmounts the whole tree and the user sees a blank white page with no clue
// what happened. With it they get a readable message, and the real error still
// reaches the console for us.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);

