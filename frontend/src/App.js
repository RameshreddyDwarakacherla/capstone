import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Navbar from './components/Layout/Navbar';
import LoadingSpinner from './components/UI/LoadingSpinner';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginUser from './pages/Auth/LoginUser';
import SignupUser from './pages/Auth/SignupUser';
import LoginAdmin from './pages/Auth/LoginAdmin';
import SignupAdmin from './pages/Auth/SignupAdmin';
import UserDashboard from './pages/User/UserDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ReportIssue from './pages/User/ReportIssue';
import IssueDetails from './pages/IssueDetails';
import MyIssues from './pages/User/MyIssues';
import AdminIssues from './pages/Admin/AdminIssues';
import MapView from './pages/Admin/MapView';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Navbar />
            
            <main className="pt-16">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login-user" element={<LoginUser />} />
                <Route path="/signup-user" element={<SignupUser />} />
                <Route path="/login-admin" element={<LoginAdmin />} />
                <Route path="/signup-admin" element={<SignupAdmin />} />
                
                {/* Protected User Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute requiredRole="user">
                    <UserDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/report-issue" element={
                  <ProtectedRoute requiredRole="user">
                    <ReportIssue />
                  </ProtectedRoute>
                } />
                <Route path="/my-issues" element={
                  <ProtectedRoute requiredRole="user">
                    <MyIssues />
                  </ProtectedRoute>
                } />
                
                {/* Protected Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/issues" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminIssues />
                  </ProtectedRoute>
                } />
                <Route path="/admin/map" element={
                  <ProtectedRoute requiredRole="admin">
                    <MapView />
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                  <ProtectedRoute requiredRole="admin">
                    <Settings />
                  </ProtectedRoute>
                } />
                
                {/* Shared Protected Routes */}
                <Route path="/issue/:id" element={
                  <ProtectedRoute>
                    <IssueDetails />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                
                {/* Redirects */}
                <Route path="/login" element={<Navigate to="/login-user" replace />} />
                <Route path="/signup" element={<Navigate to="/signup-user" replace />} />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            
            {/* Global Loading Spinner */}
            <LoadingSpinner />
            
            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#10B981',
                  },
                },
                error: {
                  style: {
                    background: '#EF4444',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
