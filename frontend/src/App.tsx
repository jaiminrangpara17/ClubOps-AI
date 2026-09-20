import { HashRouter } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { EventProvider } from "@/context/EventContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppRoutes } from "@/routes/AppRoutes";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <HashRouter>
          <AuthProvider>
            <EventProvider>
              <AppRoutes />
            </EventProvider>
          </AuthProvider>
        </HashRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
