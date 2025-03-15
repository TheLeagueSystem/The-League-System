import React, { ReactNode } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import AccountSettings from "../pages/AccountSettings";
import UsersPanel from "../pages/UsersPanel";
import MotionsPanel from "../pages/MotionsPanel";
import MotionGlossary from "../pages/MotionGlossary";
import NewRoundSetup from "../pages/NewRoundSetup";
import RoundSetup from "../pages/RoundSetup";
import ActiveRound from "../pages/ActiveRound";
import RoundManagement from "../pages/RoundManagement";
import NotificationManagement from "../pages/NotificationManagement";
import LogsPanel from "../pages/LogsPanel";  // Check this path is correct

// Define Props interface for the ProtectedRoute component
interface ProtectedRouteProps {
  children: ReactNode;
  isAdmin?: boolean;
}

// ProtectedRoute component with proper type annotations
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, isAdmin = false }) => {
  const token = localStorage.getItem("token");
  const userIsAdmin = localStorage.getItem("is_admin") === "true";
  
  console.log("ProtectedRoute check:", { 
    path: window.location.pathname,
    token: token ? "exists" : "missing", 
    userIsAdmin, 
    isAdminRequired: isAdmin 
  });

  // Check if token exists and is valid
  if (!token || token === "null" || token === "undefined") {
    console.log("No valid token found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Check if admin privileges are required but user is not admin
  if (isAdmin && !userIsAdmin) {
    console.log("Admin privileges required but user is not admin");
    return <Navigate to="/dashboard" replace />;
  }

  // Successfully authenticated
  return <>{children}</>;
};

// Updated LoginRoute to redirect to unified dashboard
const LoginRoute: React.FC<{ element: ReactNode }> = ({ element }) => {
  const token = localStorage.getItem("token");
  
  // If already logged in, redirect to the unified dashboard
  if (token && token !== "null" && token !== "undefined") {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Not logged in, show login page
  return <>{element}</>;
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          <LoginRoute element={<Login />} />
        } />
        
        {/* Unified Dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Legacy route paths that now redirect to unified dashboard */}
        <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/user-dashboard" element={<Navigate to="/dashboard" replace />} />
        
        {/* Admin-protected routes */}
        <Route path="/admin/motions" element={
          <ProtectedRoute isAdmin={true}>
            <MotionsPanel />
          </ProtectedRoute>
        } />
        <Route path="/user-management" element={
          <ProtectedRoute isAdmin={true}>
            <UsersPanel />
          </ProtectedRoute>
        } />
        <Route path="/admin/rounds/new" element={
          <ProtectedRoute isAdmin={true}>
            <NewRoundSetup />
          </ProtectedRoute>
        } />
        <Route path="/admin/rounds/:roundId/allocation" element={
          <ProtectedRoute isAdmin={true}>
            <RoundSetup />
          </ProtectedRoute>
        } />
        <Route path="/admin/rounds" element={
          <ProtectedRoute isAdmin={true}>
            <RoundManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/notifications" element={
          <ProtectedRoute isAdmin={true}>
            <NotificationManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/logs" element={
          <ProtectedRoute isAdmin={true}>
            <LogsPanel />
          </ProtectedRoute>
        } />
        
        {/* Routes available to all authenticated users */}
        <Route path="/account-settings" element={
          <ProtectedRoute>
            <AccountSettings />
          </ProtectedRoute>
        } />
        <Route path="/round/:roundId" element={
          <ProtectedRoute>
            <ActiveRound />
          </ProtectedRoute>
        } />
        <Route path="/round/:roundId/waiting-room" element={
          <Navigate to="/round/:roundId/setup" replace />
        } />
        <Route path="/motions/glossary" element={
          <ProtectedRoute>
            <MotionGlossary />
          </ProtectedRoute>
        } />
        <Route path="/round/:roundId/setup" element={
          <ProtectedRoute>
            <RoundSetup />
          </ProtectedRoute>
        } />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;