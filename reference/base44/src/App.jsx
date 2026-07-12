import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { queryClientInstance } from "@/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import PageNotFound from "./lib/PageNotFound";

import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import InterdictionDetail from "./pages/InterdictionDetail";
import InterdictionList from "./pages/InterdictionList";
import Login from "./pages/Login";
import NewInterdiction from "./pages/NewInterdiction";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Release from "./pages/Release";
import ResetPassword from "./pages/ResetPassword";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } =
    useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[hsl(220,9%,96%)]">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === "user_not_registered") {
      return <UserNotRegisteredError />;
    } else if (authError.type === "auth_required") {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        element={
          <ProtectedRoute
            unauthenticatedElement={<Navigate to="/login" replace />}
          />
        }
      >
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<NewInterdiction />} />
          <Route path="/interdiction/:id" element={<InterdictionDetail />} />
          <Route path="/interdictions" element={<InterdictionList />} />
          <Route path="/release/:id" element={<Release />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
